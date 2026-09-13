document.addEventListener('DOMContentLoaded', () => {
    const burgerContainer = document.getElementById('burger');
    const menu = document.getElementById('menu');

    // Клик ба 3-хатта менюро мекушояд/мепӯшад
    burgerContainer.addEventListener('click', (e) => {
        e.stopPropagation();
        burgerContainer.classList.toggle('active');
        menu.classList.toggle('open');
    });

    // Клик ба дарсҳои дохили меню онро мепӯшад
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('open');
            burgerContainer.classList.remove('active');
        });
    });

    // Клик берун аз меню онро автоматӣ мепӯшад
    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !burgerContainer.contains(e.target)) {
            menu.classList.remove('open');
            burgerContainer.classList.remove('active');
        }
    });
});