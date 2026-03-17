document.addEventListener('DOMContentLoaded', () => {
    const worksSection = document.getElementById('works');
    if (worksSection) {
        const worksTabButtons = worksSection.querySelectorAll('.menu-tab-btn');
        const worksTabContents = worksSection.querySelectorAll('.menu-tab-content');

        worksTabButtons.forEach(button => {
            button.addEventListener('click', () => {
                worksTabButtons.forEach(btn => btn.classList.remove('active'));
                worksTabContents.forEach(content => content.classList.remove('active'));

                button.classList.add('active');

                const contentId = button.dataset.tab;
                const activeContent = document.getElementById(contentId + 'Content');

                if (activeContent) {
                    activeContent.classList.add('active');
                }
                if (contentId === 'projects') {
                    setTimeout(() => {
                        initializeProjectsCarousel();
                    }, 50);
                }
            });
        });

        const initiallyActiveTab = worksSection.querySelector('.menu-tab-btn.active');
        if (initiallyActiveTab?.dataset.tab === 'projects') {
            setTimeout(() => {
                initializeProjectsCarousel();
            }, 50);
        }

        const projectTrack = document.getElementById('projectTrack');
        const projectPrevBtn = document.getElementById('projectPrevBtn');
        const projectNextBtn = document.getElementById('projectNextBtn');
        let projectSlides = [];
        let projectCurrentIndex = 0;
        let syncThumbs = () => {};

        function initializeProjectsCarousel() {
            if (!projectTrack || !projectPrevBtn || !projectNextBtn) return;
            projectSlides = Array.from(projectTrack.children);
            if (projectSlides.length === 0) return;
            projectCurrentIndex = 0;
            updateProjectsCarousel();

            const existingThumbs = Array.from(document.querySelectorAll('.thumb'));
            existingThumbs.forEach(t => {
                const clone = t.cloneNode(true);
                t.replaceWith(clone);
            });

            const refreshedThumbs = Array.from(document.querySelectorAll('.thumb'));

            syncThumbs = () => {
                refreshedThumbs.forEach((t, i) =>
                    t.classList.toggle('active', i === projectCurrentIndex)
                );
            };

            refreshedThumbs.forEach(t => {
                t.addEventListener('click', () => {
                    projectCurrentIndex = +t.dataset.index;
                    updateProjectsCarousel();
                    syncThumbs();
                });
            });   
        }

        function updateProjectsCarousel() {
            if (projectSlides.length === 0) return;
            const slideWidth = projectSlides[0].offsetWidth;
            const gap = parseInt(window.getComputedStyle(projectTrack).gap) || 32;
            const moveAmount = projectCurrentIndex * (slideWidth + gap);
            projectTrack.style.transform = `translateX(-${moveAmount}px)`;
            projectPrevBtn.style.display = projectCurrentIndex === 0 ? 'none' : 'block';
            projectNextBtn.style.display = projectCurrentIndex >= projectSlides.length - 1 ? 'none' : 'block';

            syncThumbs();
        }

        if (projectTrack) {
            projectNextBtn.addEventListener('click', () => {
                if (projectCurrentIndex < projectSlides.length - 1) {
                    projectCurrentIndex++;
                    updateProjectsCarousel();
                }
            });
            projectPrevBtn.addEventListener('click', () => {
                if (projectCurrentIndex > 0) {
                    projectCurrentIndex--;
                    updateProjectsCarousel();
                }
            });
            
            window.addEventListener('resize', initializeProjectsCarousel);
        }
    }
  
    const peopleSection = document.getElementById('people');
    if (peopleSection) {
        const peopleTabButtons = peopleSection.querySelectorAll('.menu-tab-btn');
        const peopleTabContents = peopleSection.querySelectorAll('.menu-tab-content');

        peopleTabButtons.forEach(button => {
            button.addEventListener('click', () => {
                peopleTabButtons.forEach(btn => btn.classList.remove('active'));
                peopleTabContents.forEach(content => content.classList.remove('active'));
                button.classList.add('active');
                const contentId = button.dataset.tab;
                const activeContent = document.getElementById(contentId + 'Content');
                if (activeContent) {
                    activeContent.classList.add('active');
                }
            });
        });

        const studentTrack = document.getElementById('studentTrack');
        const studentPrevBtn = document.getElementById('studentPrevBtn');
        const studentNextBtn = document.getElementById('studentNextBtn');

        if (studentTrack && studentPrevBtn && studentNextBtn) {
            let studentCards = [];
            let studentCurrentIndex = 0;

            const initialStudentTrack = () => {
                studentCards = Array.from(studentTrack.children);
                studentCurrentIndex = 0;
                updateStudentCarousel();
            };

            const updateStudentCarousel = () => {
                if (studentCards.length === 0) return;
                const cardWidth = studentCards[0].offsetWidth;
                const gap = parseInt(window.getComputedStyle(studentTrack).gap) || 20;
                const moveAmount = studentCurrentIndex * (cardWidth + gap);
                studentTrack.style.transform = `translateX(-${moveAmount}px)`;
                studentPrevBtn.style.display = studentCurrentIndex === 0 ? 'none' : 'block';
                const wrapperWidth = studentTrack.parentElement.clientWidth;
                const trackWidth = studentTrack.scrollWidth;
                studentNextBtn.style.display = (moveAmount + wrapperWidth >= trackWidth - 1) ? 'none' : 'block';
            };

            studentNextBtn.addEventListener('click', () => {
                if (studentCurrentIndex < studentCards.length - 1) {
                    studentCurrentIndex++;
                    updateStudentCarousel();
                }
            });
            studentPrevBtn.addEventListener('click', () => {
                if (studentCurrentIndex > 0) {
                    studentCurrentIndex--;
                    updateStudentCarousel();
                }
            });

            if (document.querySelector('#studentsContent.active')) {
                setTimeout(initialStudentTrack, 100);
            }
            window.addEventListener('resize', initialStudentTrack);
        }
    }

 
});
