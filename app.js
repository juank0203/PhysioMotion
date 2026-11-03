/* ===== PhysioMotion · lógica del prototipo ===== */
(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  /* ---------- Datos ---------- */
  const QUESTIONS = [
    {
      q: '¿Qué te gustaría explorar primero?',
      sub: 'Elige la opción que más se acerque a ti.',
      options: ['Movilidad acompañada', 'Relajación y bienestar', 'Conocer la plataforma']
    },
    {
      q: '¿Qué zona quieres trabajar?',
      sub: 'Armaremos tu plan con base en esta zona.',
      options: ['Rodilla o pierna', 'Espalda', 'Hombro o brazo']
    },
    {
      q: '¿Cómo describes tu nivel de dolor hoy?',
      sub: 'Así ajustamos la intensidad de los ejercicios.',
      options: ['Leve', 'Moderado', 'Intenso']
    },
    {
      q: '¿Cuánto tiempo quieres dedicar al día?',
      sub: 'Puedes cambiarlo más adelante.',
      options: ['5 min', '10 min', '15 min']
    },
    {
      q: '¿Cómo prefieres recibir las instrucciones?',
      sub: 'Siempre tendrás el botón de audio disponible.',
      options: ['Texto e imagen', 'Audio', 'Ambos']
    }
  ];

  const PLANS = [
    {
      name: 'Lección de rodilla o pierna', icon: '🦵',
      exercises: [
        { name: 'Sentadilla', desc: 'Treinta sentadillas controladas', reps: 30, img: 'assets/squat.png', cue: ['Baja despacio', 'Sube con control'] },
        { name: 'Elevación de talones', desc: 'Veinte elevaciones apoyado en una silla', reps: 20, emoji: '🦶', cue: ['Sube en puntas', 'Baja lento'] },
        { name: 'Extensión de rodilla', desc: 'Quince extensiones sentado', reps: 15, emoji: '🪑', cue: ['Estira la pierna', 'Regresa suave'] }
      ]
    },
    {
      name: 'Lección de espalda', icon: '🧍',
      exercises: [
        { name: 'Gato y camello', desc: 'Diez movimientos lentos en cuatro apoyos', reps: 10, emoji: '🐈', cue: ['Arquea la espalda', 'Redondea la espalda'] },
        { name: 'Puente de glúteos', desc: 'Doce elevaciones de cadera', reps: 12, emoji: '🌉', cue: ['Eleva la cadera', 'Baja con control'] },
        { name: 'Rotación de tronco', desc: 'Diez giros suaves sentado', reps: 10, emoji: '🔄', cue: ['Gira a la derecha', 'Gira a la izquierda'] }
      ]
    },
    {
      name: 'Lección de hombro o brazo', icon: '💪',
      exercises: [
        { name: 'Círculos de hombro', desc: 'Veinte círculos hacia atrás', reps: 20, emoji: '⭕', cue: ['Sube los hombros', 'Llévalos atrás'] },
        { name: 'Elevación de brazos', desc: 'Quince elevaciones frontales', reps: 15, emoji: '🙆', cue: ['Sube los brazos', 'Baja despacio'] },
        { name: 'Apertura de pecho', desc: 'Doce aperturas con los brazos', reps: 12, emoji: '🤸', cue: ['Abre los brazos', 'Cierra al frente'] }
      ]
    }
  ];

  const XP_FULL = 20;
  const XP_SKIP = 10;
  const SECONDS_PER_REP = 2;
  const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const STORE_KEY = 'physiomotion-v1';

  /* ---------- Estado (guardado en el navegador) ---------- */
  const fresh = () => ({ name: '', answers: [null, null, null, null, null], quizDone: false, xp: 0, done: [], days: [], bigText: false });
  let state = load();

  function load() {
    try { return Object.assign(fresh(), JSON.parse(localStorage.getItem(STORE_KEY)) || {}); }
    catch (e) { return fresh(); }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* almacenamiento no disponible */ }
  }

  const plan = () => PLANS[state.answers[1] ?? 0];
  const pain = () => QUESTIONS[2].options[state.answers[2] ?? 1];
  const goal = () => QUESTIONS[3].options[state.answers[3] ?? 1];
  const focus = () => QUESTIONS[0].options[state.answers[0] ?? 0];
  const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  /* ---------- Navegación ---------- */
  const APP_SCREENS = ['home', 'exercise', 'done', 'profile', 'meditation', 'progress'];
  let current = '';

  function show(name) {
    stopAll();
    current = name;
    const inApp = APP_SCREENS.includes(name);
    $('#app-shell').hidden = !inApp;
    $$('.screen').forEach((s) => s.classList.toggle('active', s.id === 'screen-' + name));
    $$('.bottom-nav button').forEach((b) => {
      const on = b.dataset.go === name || (b.dataset.go === 'home' && (name === 'exercise' || name === 'done'));
      b.classList.toggle('active', on);
      b.setAttribute('aria-current', on ? 'page' : 'false');
    });
    if (name === 'home') renderHome();
    if (name === 'profile') renderProfile();
    if (name === 'progress') renderProgress();
    if (name === 'quiz') renderQuiz();
    if (['home', 'profile', 'meditation', 'progress'].includes(name)) history.replaceState(null, '', '#' + name);
    window.scrollTo(0, 0);
  }

  function boot() {
    document.documentElement.classList.toggle('big-text', !!state.bigText);
    $('#a11y-btn').setAttribute('aria-pressed', String(!!state.bigText));
    renderCommon();
    if (!state.name) return show('login');
    if (!state.quizDone) return show('quiz');
    const h = location.hash.slice(1);
    show(['home', 'profile', 'meditation', 'progress'].includes(h) ? h : 'home');
  }

  function renderCommon() {
    $$('.js-name').forEach((el) => (el.textContent = state.name || 'Amigo'));
    $$('.js-plan').forEach((el) => (el.textContent = plan().name));
    $$('.js-levels').forEach((el) => (el.textContent = `${state.done.length}/3`));
    $$('.plan-icon').forEach((el) => (el.textContent = plan().icon));
    $('#xp-header').textContent = `${state.xp} XP`;
  }

  /* ---------- 1. Bienvenida ---------- */
  $('#login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const val = $('#nickname').value.trim();
    if (val.length < 2) {
      $('#login-error').textContent = 'Escribe un apodo de al menos 2 letras.';
      $('#nickname').focus();
      return;
    }
    $('#login-error').textContent = '';
    state.name = val.charAt(0).toUpperCase() + val.slice(1);
    save();
    renderCommon();
    show(state.quizDone ? 'home' : 'quiz');
  });

  /* ---------- 2. Cuestionario ---------- */
  let qi = 0;

  function renderQuiz() {
    const Q = QUESTIONS[qi];
    const pct = Math.round(((qi + 1) / QUESTIONS.length) * 100);
    $('#quiz-count').textContent = `Pregunta ${qi + 1} de ${QUESTIONS.length}`;
    $('#quiz-pct').textContent = pct + '%';
    $('#quiz-bar').style.width = pct + '%';
    $('#quiz-q').textContent = Q.q;
    $('#quiz-sub').textContent = Q.sub;
    const box = $('#quiz-options');
    box.innerHTML = '';
    Q.options.forEach((opt, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'option';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(state.answers[qi] === i));
      b.innerHTML = '<span class="radio"></span><span></span>';
      b.lastChild.textContent = opt;
      b.addEventListener('click', () => {
        state.answers[qi] = i;
        save();
        renderQuiz();
      });
      box.appendChild(b);
    });
    const picked = state.answers[qi] !== null && state.answers[qi] !== undefined;
    $('#quiz-saved').textContent = picked ? 'Selección guardada, puedes continuar.' : '';
    $('#quiz-next').disabled = !picked;
    $('#quiz-next').textContent = qi === QUESTIONS.length - 1 ? 'Finalizar' : 'Continuar';
    $('#quiz-prev').style.visibility = qi === 0 ? 'hidden' : 'visible';
  }

  $('#quiz-prev').addEventListener('click', () => { if (qi > 0) { qi--; renderQuiz(); } });
  $('#quiz-next').addEventListener('click', () => {
    if (qi < QUESTIONS.length - 1) { qi++; renderQuiz(); return; }
    state.quizDone = true;
    save();
    renderCommon();
    show('home');
    toast(`¡Listo, ${state.name}! Tu plan está preparado.`);
  });

  /* ---------- 3. Inicio ---------- */
  function renderHome() {
    renderCommon();
    const list = $('#levels');
    list.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const done = state.done.includes(i);
      const unlocked = i === 0 || state.done.includes(i - 1);
      const isCurrent = unlocked && !done;
      const li = document.createElement('li');
      li.className = 'level ' + (done ? 'done unlocked' : unlocked ? 'unlocked' : 'locked') + (isCurrent ? ' current' : '');
      const label = `Nivel ${i + 1}` + (done ? ' (completado)' : unlocked ? '' : ' (bloqueado)');
      li.innerHTML = `<button type="button" class="level-btn" aria-label="${label}"><img src="assets/${unlocked ? 'star' : 'lock'}.png" alt=""></button><span>Nivel ${i + 1}</span>`;
      li.querySelector('button').addEventListener('click', () => {
        if (!unlocked) return toast(`Completa el nivel ${i} para desbloquear este.`);
        openExercise(i);
      });
      list.appendChild(li);
    }
  }

  /* ---------- 4. Ejercicio ---------- */
  let exLevel = 0, exLeft = 0, exTimer = null;

  function openExercise(level) {
    exLevel = level;
    const ex = plan().exercises[level];
    exLeft = ex.reps;
    const imgBox = $('#ex-img');
    const card = imgBox.parentElement;
    card.querySelector('.ex-emoji')?.remove();
    if (ex.img) {
      imgBox.hidden = false;
      imgBox.src = ex.img;
      imgBox.alt = 'Ilustración del ejercicio ' + ex.name;
    } else {
      imgBox.hidden = true;
      const em = document.createElement('div');
      em.className = 'ex-emoji';
      em.setAttribute('aria-hidden', 'true');
      em.textContent = ex.emoji;
      card.insertBefore(em, imgBox);
    }
    $('#ex-name').textContent = ex.name;
    $('#ex-desc').textContent = ex.desc;
    $('#ex-count').textContent = ex.reps;
    $('#ex-step').textContent = `Ritmo: una repetición cada ${SECONDS_PER_REP} segundos`;
    $('#ex-bar').style.width = '0%';
    $('#ex-start').textContent = 'Empezar';
    show('exercise');
  }

  function tick() {
    const ex = plan().exercises[exLevel];
    exLeft--;
    const doneReps = ex.reps - exLeft;
    const c = $('#ex-count');
    c.textContent = exLeft;
    c.classList.add('tick');
    setTimeout(() => c.classList.remove('tick'), 180);
    $('#ex-bar').style.width = (doneReps / ex.reps) * 100 + '%';
    $('#ex-step').textContent = `${ex.cue[doneReps % 2]} · repetición ${doneReps} de ${ex.reps}`;
    if (exLeft <= 0) { stopExercise(); completeLevel(XP_FULL); }
  }

  function stopExercise() { clearInterval(exTimer); exTimer = null; }

  $('#ex-start').addEventListener('click', () => {
    if (exTimer) {
      stopExercise();
      $('#ex-start').textContent = 'Continuar';
      $('#ex-step').textContent = 'En pausa';
      return;
    }
    $('#ex-start').textContent = 'Pausar';
    $('#ex-step').textContent = '¡Vamos!';
    exTimer = setInterval(tick, SECONDS_PER_REP * 1000);
  });
  $('#ex-skip').addEventListener('click', () => { stopExercise(); completeLevel(XP_SKIP, true); });
  $('#ex-close').addEventListener('click', () => show('home'));

  /* ---------- 5. Nivel completado ---------- */
  function completeLevel(xp, skipped) {
    const first = !state.done.includes(exLevel);
    if (first) state.done.push(exLevel);
    const gained = first ? xp : 0;
    state.xp += gained;
    const k = todayKey();
    if (!skipped && !state.days.includes(k)) state.days.push(k);
    save();
    renderCommon();
    $('#done-title').textContent = `¡Nivel ${exLevel + 1} completado!`;
    $('#done-xp').textContent = gained ? `+ ${gained} XP${skipped ? ' (ejercicio saltado)' : ''}` : 'Ya habías ganado los XP de este nivel';
    show('done');
    const badge = $('.xp-badge');
    badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump');
    const smile = $('#screen-done .smiley');
    smile.classList.remove('pop'); void smile.offsetWidth; smile.classList.add('pop');
  }
  $('#done-continue').addEventListener('click', () => {
    show('home');
    if (state.done.length === 3) toast('¡Completaste todo tu plan! 🎉');
  });

  /* ---------- 6. Perfil ---------- */
  function renderProfile() {
    renderCommon();
    $('#st-xp').textContent = state.xp;
    $('#st-goal').textContent = goal();
    $('#st-pain').textContent = pain();
    $('#st-focus').textContent = focus();
  }

  function finishEdit() {
    const input = $('#profile-name-input');
    const v = input.value.trim();
    if (v.length >= 2) { state.name = v.charAt(0).toUpperCase() + v.slice(1); save(); }
    input.hidden = true;
    $('#profile-name').hidden = false;
    renderProfile();
  }
  $('#edit-name').addEventListener('click', () => {
    const input = $('#profile-name-input');
    if (!input.hidden) return finishEdit();
    input.value = state.name;
    input.hidden = false;
    $('#profile-name').hidden = true;
    input.focus();
    input.select();
  });
  $('#profile-name-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') finishEdit(); if (e.key === 'Escape') { e.target.value = state.name; finishEdit(); } });
  $('#profile-name-input').addEventListener('blur', finishEdit);
  $('#edit-name').addEventListener('mousedown', (e) => e.preventDefault()); // evita que el lápiz cierre la edición por "blur"

  $('#reset').addEventListener('click', () => { $('#modal').hidden = false; $('#modal-cancel').focus(); });
  $('#modal-cancel').addEventListener('click', () => ($('#modal').hidden = true));
  $('#modal-ok').addEventListener('click', () => {
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* nada */ }
    state = fresh();
    qi = 0;
    $('#modal').hidden = true;
    $('#nickname').value = '';
    document.documentElement.classList.remove('big-text');
    $('#a11y-btn').setAttribute('aria-pressed', 'false');
    history.replaceState(null, '', location.pathname);
    show('login');
  });

  /* ---------- 7. Meditación ---------- */
  let medTimers = [];
  let medMode = null;
  const circle = $('#breath-circle');

  function clearMed() {
    medTimers.forEach(clearTimeout);
    medTimers = [];
    medMode = null;
    circle.style.transitionDuration = '.6s';
    circle.style.transform = 'scale(1)';
    $('#breath-text').textContent = 'Respira con el círculo';
    $('#breath-sub').textContent = 'Toca el círculo para empezar';
    $$('.med-item').forEach((m) => m.classList.remove('running'));
  }

  function at(ms, fn) { medTimers.push(setTimeout(fn, ms)); }

  function startBreathing() {
    clearMed();
    medMode = 'breath';
    $('#med-breath').classList.add('running');
    const CYCLES = 4;
    let t = 0;
    for (let c = 0; c < CYCLES; c++) {
      const n = c + 1;
      at(t, () => { phase('Inhala…', `Ciclo ${n} de ${CYCLES} · 4 segundos`, 1.7, 4); });
      t += 4000;
      at(t, () => { phase('Sostén…', `Ciclo ${n} de ${CYCLES} · 7 segundos`, 1.7, .3); });
      t += 7000;
      at(t, () => { phase('Exhala…', `Ciclo ${n} de ${CYCLES} · 8 segundos`, 1, 8); });
      t += 8000;
    }
    at(t, () => { clearMed(); $('#breath-text').textContent = 'Muy bien, terminaste 🌿'; $('#breath-sub').textContent = 'Toca el círculo para repetir'; });
  }

  function phase(title, sub, scale, secs) {
    circle.style.transitionDuration = secs + 's';
    circle.style.transform = `scale(${scale})`;
    $('#breath-text').textContent = title;
    $('#breath-sub').textContent = sub;
  }

  function startScan() {
    clearMed();
    medMode = 'scan';
    $('#med-scan').classList.add('running');
    const parts = ['tus pies', 'tus tobillos', 'tus rodillas', 'tus piernas', 'tu cadera', 'tu abdomen', 'tu espalda', 'tus hombros', 'tus brazos y manos', 'tu cuello', 'tu rostro', 'tu cabeza'];
    parts.forEach((p, i) => at(i * 6000, () => phase('Lleva tu atención a ' + p, `Paso ${i + 1} de ${parts.length} · respira con calma`, i % 2 ? 1.25 : 1.45, 3)));
    at(parts.length * 6000, () => { clearMed(); $('#breath-text').textContent = 'Escaneo terminado 🌿'; $('#breath-sub').textContent = 'Nota cómo se siente tu cuerpo ahora'; });
  }

  circle.addEventListener('click', () => (medMode ? clearMed() : startBreathing()));
  $('#med-breath').addEventListener('click', () => (medMode === 'breath' ? clearMed() : startBreathing()));
  $('#med-scan').addEventListener('click', () => (medMode === 'scan' ? clearMed() : startScan()));

  /* ---------- 8. Progreso ---------- */
  let calDate = new Date();
  calDate.setDate(1);

  function renderProgress() {
    renderCommon();
    const now = new Date();
    const monthPrefix = todayKey(now).slice(0, 7);
    $('#pg-xp').textContent = state.xp;
    $('#pg-days').textContent = state.days.length;
    $('#pg-month').textContent = state.days.filter((d) => d.startsWith(monthPrefix)).length;
    renderCalendar();
  }

  function renderCalendar() {
    const y = calDate.getFullYear(), m = calDate.getMonth();
    $('#cal-title').textContent = `${MONTHS[m]} ${y}`;
    const grid = $('#cal-grid');
    grid.innerHTML = '';
    ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].forEach((d) => {
      const el = document.createElement('span');
      el.className = 'dow';
      el.textContent = d;
      grid.appendChild(el);
    });
    const offset = (new Date(y, m, 1).getDay() + 6) % 7; // lunes = 0
    const total = new Date(y, m + 1, 0).getDate();
    for (let i = 0; i < offset; i++) grid.appendChild(document.createElement('span'));
    const today = todayKey();
    for (let d = 1; d <= total; d++) {
      const key = todayKey(new Date(y, m, d));
      const el = document.createElement('span');
      el.className = 'day' + (key === today ? ' today' : '') + (state.days.includes(key) ? ' done' : '');
      el.textContent = d;
      grid.appendChild(el);
    }
  }
  $('#cal-prev').addEventListener('click', () => { calDate.setMonth(calDate.getMonth() - 1); renderCalendar(); });
  $('#cal-next').addEventListener('click', () => { calDate.setMonth(calDate.getMonth() + 1); renderCalendar(); });

  /* ---------- Menú inferior ---------- */
  $$('.bottom-nav button').forEach((b) => b.addEventListener('click', () => show(b.dataset.go)));

  /* ---------- Accesibilidad: texto grande ---------- */
  $('#a11y-btn').addEventListener('click', () => {
    state.bigText = !state.bigText;
    save();
    document.documentElement.classList.toggle('big-text', state.bigText);
    $('#a11y-btn').setAttribute('aria-pressed', String(state.bigText));
    toast(state.bigText ? 'Texto grande activado' : 'Texto normal');
  });

  /* ---------- Audio: leer la pantalla en voz alta ---------- */
  const synth = window.speechSynthesis;
  function stopSpeech() {
    if (synth && synth.speaking) synth.cancel();
    $('#audio-btn').classList.remove('speaking');
  }
  $('#audio-btn').addEventListener('click', () => {
    if (!synth) return toast('Tu navegador no permite lectura en voz alta');
    if (synth.speaking) return stopSpeech();
    const scr = $('#screen-' + current);
    const text = scr ? scr.innerText.replace(/\s+/g, ' ').trim() : '';
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES';
    u.rate = 0.95;
    const voice = synth.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith('es'));
    if (voice) u.voice = voice;
    u.onend = u.onerror = () => $('#audio-btn').classList.remove('speaking');
    $('#audio-btn').classList.add('speaking');
    synth.speak(u);
  });

  function stopAll() { stopExercise(); clearMed(); stopSpeech(); }

  /* ---------- Aviso breve ---------- */
  let toastT;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 2600);
  }

  window.addEventListener('hashchange', () => {
    const h = location.hash.slice(1);
    if (state.quizDone && ['home', 'profile', 'meditation', 'progress'].includes(h) && h !== current) show(h);
  });

  boot();
})();
