// svg/basket.js — корзина для кнопки «Собрать всё» (inline SVG)

const SvgBasket = {
    render() {
        return `
            <svg viewBox="0 0 60 60" width="24" height="24" class="basket-icon" xmlns="http://www.w3.org/2000/svg">
                <path d="M18,14 Q30,-4 42,14" stroke="#6D4C41" stroke-width="4" fill="none" stroke-linecap="round"/>
                <path d="M10,24 L50,24 L44,52 Q43,55 40,55 L20,55 Q17,55 16,52 Z" fill="#8D6E63" stroke="#6D4C41" stroke-width="2"/>
                <path d="M14,24 Q30,35 46,24" stroke="#6D4C41" stroke-width="2" fill="none" opacity="0.6"/>
                <circle cx="24" cy="32" r="4" fill="#FF9800"/>
                <circle cx="33" cy="30" r="4" fill="#F44336"/>
                <circle cx="29" cy="38" r="4" fill="#FFC107"/>
            </svg>
        `;
    }
};
