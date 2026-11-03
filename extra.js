(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- запись: календарные кнопки дней
  $$("[data-s-days] label").forEach((lab, i) => {
    const inp = $("input", lab), m = (inp.dataset.full || "").match(/(\S+)\s+(\d+)\s+(\S+)$/);
    if (!m) return;
    lab.classList.add("x-day");
    $("span", lab).outerHTML = `<small>${m[1]}</small><b>${m[2]}</b><em>${m[3]}</em>${i < 2 ? `<i>${i ? "завтра" : "сегодня"}</i>` : ""}`;
  });

  // ---------- запись: несколько услуг, общие день и время
  const svc = () => $$("input[name=svc]");
  const checkedSvc = () => svc().filter((i) => i.checked);
  const bubble = $("[data-s-bubble]"), sum = $("[data-x-sum]"), hint = $("[data-x-hint]"), send = $('[data-s-msg="vk"]');
  const plural = (n) => (n % 10 === 1 && n % 100 !== 11 ? "услуга" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "услуги" : "услуг");
  let lastSum = "";
  const refresh = () => {
    const picked = checkedSvc().map((i) => i.dataset.name);
    const dayIn = $("[data-s-days] input:checked"), timeIn = $("[data-s-times] input:checked");
    const day = dayIn ? dayIn.dataset.full : "", time = timeIn ? timeIn.value : "";
    const when = [day, time].filter(Boolean).join(", ");
    if (!picked.length) {
      bubble.textContent = "Услуга не выбрана. Отметьте хотя бы одну услугу выше - она появится в сообщении.";
      sum.className = "x-sum"; sum.textContent = "Выберите услуги, удобный день и время";
    } else {
      const list = picked.length === 1 ? "Услуга: " + picked[0] + "." : "Услуги:\n" + picked.map((p, i) => (i + 1) + ". " + p).join("\n");
      bubble.textContent = "Здравствуйте! Хочу записаться в Лабораторию № 1.\n" + list + "\nУдобное время: " + (when || "уточню") + " (прошу подтвердить).\nМарку, год и что беспокоит – напишу ниже.";
      sum.className = "x-sum is-ready";
      sum.innerHTML = `<span class="x-sum__ok" aria-hidden="true">✓</span><span class="x-sum__tag">${picked.length} ${plural(picked.length)}</span>${day ? `<span class="x-sum__tag">${day}</span>` : ""}${time ? `<span class="x-sum__tag">${time}</span>` : ""}`;
    }
    if (sum.innerHTML !== lastSum) { lastSum = sum.innerHTML; if (!reduce) { sum.classList.remove("is-bump"); void sum.offsetWidth; sum.classList.add("is-bump"); } }
    if (picked.length && hint) hint.hidden = true;
    if (send) send.setAttribute("aria-disabled", picked.length ? "false" : "true");
    $$(".x-spot").forEach((b) => b.setAttribute("aria-pressed", String(!!(svc()[+b.dataset.svc] || {}).checked)));
  };
  document.addEventListener("change", (e) => { if (e.target.closest("[data-s-booking]")) refresh(); });
  $("[data-x-all]").addEventListener("click", () => { svc().forEach((i) => (i.checked = true)); refresh(); });
  $("[data-x-none]").addEventListener("click", () => { svc().forEach((i) => (i.checked = false)); refresh(); });

  // ВКонтакте: полный текст заявки копируется, диалог сообщества открывается
  window.addEventListener("click", (e) => {
    const a = e.target.closest('[data-s-msg="vk"]'); if (!a) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (!checkedSvc().length) {
      if (hint) { hint.hidden = false; hint.classList.remove("is-shake"); void hint.offsetWidth; hint.classList.add("is-shake"); hint.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" }); }
      return;
    }
    window.open(a.href, "_blank", "noopener");
    try { navigator.clipboard.writeText(bubble.textContent).catch(() => {}); } catch (_) {}
    const note = $("[data-s-copied]");
    if (note) { note.hidden = false; setTimeout(() => (note.hidden = true), 7000); }
  }, true);

  // ---------- «Живая диагностика»
  const spots = $$(".x-spot"), info = $("#x-info"), leader = $(".x-leader__line"), frame = $(".x-frame");
  let cur = 0;
  const drawLeader = (animate) => {
    if (!leader || !frame || getComputedStyle(leader.ownerSVGElement).display === "none") return;
    const s = spots[cur], x = parseFloat(s.style.getPropertyValue("--x")), y = parseFloat(s.style.getPropertyValue("--y"));
    const fr = frame.getBoundingClientRect(), ty = (info.getBoundingClientRect().top - fr.top) / fr.height * 100 - 1.5;
    leader.setAttribute("d", ty > y + 3 ? `M${x} ${y + 3}V${ty}M${x - 3} ${ty}H${x + 3}` : "M0 0");
    leader.classList.remove("is-draw");
    if (animate && !reduce) { void leader.getBoundingClientRect(); leader.classList.add("is-draw"); }
  };
  const showInfo = (i, animate = true) => {
    cur = i;
    spots.forEach((b, k) => b.classList.toggle("is-cur", k === i));
    const b = spots[i];
    $("[data-x-info-t]").textContent = b.dataset.t; $("[data-x-info-d]").textContent = b.dataset.d;
    info.classList.remove("is-swap"); void info.offsetWidth; info.classList.add("is-swap");
    drawLeader(animate);
  };
  spots.forEach((b, i) => b.addEventListener("click", () => {
    const box = svc()[i]; if (box) { box.checked = !box.checked; box.dispatchEvent(new Event("change", { bubbles: true })); }
    showInfo(i);
  }));
  document.addEventListener("change", (e) => { if (e.target.name === "svc" && e.target.checked) showInfo(svc().indexOf(e.target)); });
  $(".x-info__go").addEventListener("click", () => { const box = svc()[cur]; if (box && !box.checked) { box.checked = true; box.dispatchEvent(new Event("change", { bubbles: true })); } });
  window.addEventListener("resize", () => drawLeader(false));
  showInfo(0, false);
  setTimeout(() => drawLeader(true), reduce ? 0 : 1500);
  refresh();

  // ---------- свет фар на кнопках
  document.addEventListener("pointermove", (e) => {
    const b = e.target.closest && e.target.closest(".s-btn"); if (!b) return;
    const r = b.getBoundingClientRect(); b.style.setProperty("--mx", e.clientX - r.left + "px"); b.style.setProperty("--my", e.clientY - r.top + "px");
  }, { passive: true });

  // ---------- бургер-меню
  const burger = $(".x-burger"), menu = $("#x-menu");
  const setMenu = (open) => { if (!burger || !menu) return; burger.setAttribute("aria-expanded", open); menu.hidden = !open; };
  if (burger) {
    burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  }

  // ---------- плавающая кнопка связи: прячется, пока видны кнопки первого экрана или форма
  const fab = $("[data-x-fab]"), fabBtn = $(".x-fab__btn"), fabList = $("#x-fab-list");
  const setFab = (open) => { fabBtn.setAttribute("aria-expanded", open); fabList.hidden = !open; fab.classList.toggle("is-open", open); };
  if (fab) {
    fabBtn.addEventListener("click", () => setFab(fabBtn.getAttribute("aria-expanded") !== "true"));
    fabList.addEventListener("click", () => setFab(false));
    document.addEventListener("click", (e) => { if (!fab.contains(e.target)) setFab(false); });
    const watch = [$(".x-actions"), $("#widget")].filter(Boolean), seen = new Set();
    if (watch.length && "IntersectionObserver" in window) {
      fab.classList.add("is-away");
      const io = new IntersectionObserver((es) => { es.forEach((en) => (en.isIntersecting ? seen.add(en.target) : seen.delete(en.target))); const away = seen.size > 0; fab.classList.toggle("is-away", away); if (away) setFab(false); }, { threshold: .25 });
      watch.forEach((el) => io.observe(el));
    }
  }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { setMenu(false); if (fab) setFab(false); } });
  window.addEventListener("resize", () => { if (innerWidth > 860) setMenu(false); });

  // ---------- Яндекс Карта: подключаем, только если виджет Яндекса достижим; иначе остаётся схема с кнопками
  const map = $("[data-x-map]");
  if (map) {
    const ifr = $("iframe", map), open = $(".x-map__open", map);
    const start = () => {
      const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 5000);
      fetch(ifr.dataset.src, { mode: "no-cors", cache: "no-store", signal: ctl.signal }).then(() => {
        clearTimeout(timer);
        ifr.addEventListener("load", () => { map.classList.add("is-live"); if (open) open.hidden = false; }, { once: true });
        ifr.hidden = false; ifr.src = ifr.dataset.src;
      }).catch(() => { /* карта недоступна: остаётся схема с кнопками */ });
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); start(); } }, { rootMargin: "400px" });
      io.observe(map);
    } else start();
  }

  // ---------- плавное появление карточек по очереди
  const items = $$(".s-board__row, .s-steps__item, .s-reviews li, .s-photos figure, .x-card");
  if ("IntersectionObserver" in window && !reduce) {
    items.forEach((el, i) => { el.classList.add("x-pre"); el.style.setProperty("--x-d", (i % 4) * 70 + "ms"); });
    const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("x-in"); io.unobserve(en.target); } }), { threshold: .12 });
    items.forEach((el) => io.observe(el));
  }
})();
