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

    mountLessonVideos();
});

function youtubeVideoId(value) {
    if (!value) return '';
    const text = String(value).trim();
    const match = text.match(
        /(?:youtube\.com\/watch\?(?:[^#\s]*&)?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    if (match) return match[1];
    if (/^[A-Za-z0-9_-]{11}$/.test(text)) return text;
    return '';
}

function mountLessonVideos() {
    document.querySelectorAll('.lesson-youtube').forEach((box) => {
        const link = box.querySelector('a');
        const id = youtubeVideoId(box.getAttribute('data-youtube'))
            || youtubeVideoId(link && link.getAttribute('href'))
            || youtubeVideoId(box.textContent);
        if (!id) return;

        if (box.querySelector('iframe')) {
            box.hidden = false;
            return;
        }

        box.hidden = false;
        box.classList.add('is-ready');
        box.innerHTML =
            '<h2>Видеои дарс</h2>' +
            '<div class="lesson-video-frame">' +
                '<iframe src="https://www.youtube.com/embed/' + id + '?rel=0" ' +
                    'title="Видеои дарс" ' +
                    'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ' +
                    'allowfullscreen ' +
                    'referrerpolicy="strict-origin-when-cross-origin"></iframe>' +
            '</div>';
    });
}
