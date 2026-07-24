// ui.js — общие UI-компоненты: тосты, всплывающие числа, модалки

const UI = {
    // Показывает всплывающий текст (например "+5 💧") у координат x,y экрана
    showFloatingText(text, x, y, color) {
        const layer = document.getElementById('floatingTextLayer');
        const el = document.createElement('div');
        el.className = 'floating-text';
        el.textContent = text;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        if (color) el.style.color = color;
        layer.appendChild(el);
        setTimeout(() => el.remove(), 900);
    },

    // Показывает короткий тост-уведомление
    showToast(text) {
        const root = document.getElementById('toastRoot');
        const el = document.createElement('div');
        el.className = 'toast';
        el.textContent = text;
        root.appendChild(el);
        setTimeout(() => el.remove(), 2500);
    },

    // Открывает модалку с произвольным HTML-содержимым, возвращает функцию закрытия.
    // Содержимое лежит в .modal-body — отдельно от кнопки закрытия, чтобы экраны
    // (например магазин апгрейдов) могли обновлять его на месте, не теряя крестик
    openModal(innerHtml) {
        const root = document.getElementById('modalRoot');
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <button class="modal-close" aria-label="Закрыть">✕</button>
                <div class="modal-body">${innerHtml}</div>
            </div>
        `;
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
        overlay.querySelector('.modal-close').addEventListener('click', close);
        root.appendChild(overlay);

        function close() {
            overlay.remove();
        }

        return close;
    }
};
