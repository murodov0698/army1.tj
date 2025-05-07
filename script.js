// Маълумот дар бораи дарсҳо
const lessons = [
    {
        week: 1,
        title: "Муқаддимаи забони англисӣ",
        lessons: [
            {
                title: "Салом ва муаррифӣ",
                content: "Омӯзиши саломҳо, муаррифӣ ва заминҳо",
                vocabulary: ["Hello", "Hi", "Good morning", "Good afternoon", "Good evening"],
                grammar: "Структураи соддаи ҷумла: Subject + verb"
            },
            {
                title: "Рақамҳо, рӯзҳо ва моҳҳо",
                content: "Омӯзиши рақамҳо (1-100), рӯзҳои ҳафта ва моҳҳои сол",
                vocabulary: ["Numbers 1-100", "Days of week", "Months of year"],
                grammar: "Пурсиш ва ҷавоб додан: What day is it today?"
            }
        ]
    },
    // Дарсҳои дигар бояд илова карда шаванд
];

// Функсия барои создани карточкаи дарс
function createLessonCard(lesson) {
    return `
        <div class="lesson-card">
            <h3>${lesson.title}</h3>
            <p>${lesson.content}</p>
            <div class="lesson-details">
                <h4>Вокабуляр:</h4>
                <ul>
                    ${lesson.vocabulary.map(word => `<li>${word}</li>`).join('')}
                </ul>
                <h4>Грамматика:</h4>
                <p>${lesson.grammar}</p>
            </div>
        </div>
    `;
}

// Функсия барои илова кардани дарсҳо ба саҳифа
function displayLessons() {
    const lessonsGrid = document.querySelector('.lessons-grid');
    if (!lessonsGrid) return;

    lessons.forEach(week => {
        week.lessons.forEach(lesson => {
            lessonsGrid.innerHTML += createLessonCard(lesson);
        });
    });
}

// Функсия барои кор кардани менюи мобилӣ
function setupMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        // Пешгирӣ кардани пахши тасодуфӣ берун аз меню
        menuToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            navLinks.classList.toggle('active');
            // Тағйир додани иконка
            const icon = menuToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });

        // Пӯшидани меню ҳангоми пахш кардани пайванд
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                }
            });
        });

        // Пӯшидани меню ҳангоми пахш кардани берун аз он
        document.addEventListener('click', (event) => {
            if (!event.target.closest('nav') && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                }
            }
        });
    }
}

// Функсия барои инициализатсияи саҳифа
function initializePage() {
    displayLessons();
    setupMobileMenu();
}

// Инициализатсияи саҳифа ҳангоми боргирӣ
document.addEventListener('DOMContentLoaded', initializePage); 