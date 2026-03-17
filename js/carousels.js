document.addEventListener('DOMContentLoaded', () => {
    const worksSection = document.getElementById('works');
    if (worksSection) {
        const worksTabButtons = worksSection.querySelectorAll('.menu-tab-btn');
        const worksTabContents = worksSection.querySelectorAll('.menu-tab-content');
        const projectTrack = document.getElementById('projectTrack');
        const thumbTrack = document.getElementById('thumbTrack');
        const projectPrevBtn = document.getElementById('projectPrevBtn');
        const projectNextBtn = document.getElementById('projectNextBtn');

        const PROJECTS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbylw7ICcjiNh8tZTtHw8hUYUrHT8yxGytQYlrnydEsCvY-aijCqH2wkoumHrQGETX8W/exec';

        let projectSlides = [];
        let projectCurrentIndex = 0;
        let syncThumbs = () => {};

        const normalizeBoolean = (value) => {
            if (typeof value === 'boolean') return value;
            if (typeof value === 'number') return value !== 0;
            return String(value || '').toLowerCase() === 'true';
        };

        const getProjectsFromResponse = (payload) => {
            if (Array.isArray(payload)) return payload;
            if (Array.isArray(payload?.data)) return payload.data;
            if (Array.isArray(payload?.projects)) return payload.projects;
            if (Array.isArray(payload?.items)) return payload.items;
            return [];
        };

        const renderProjectSlides = (projects) => {
            if (!projectTrack || !thumbTrack) return;

            projectTrack.innerHTML = projects.map(project => `
                <div class="project-slide">
                  <div class="project-detail-layout">
                    <div class="project-image-wrapper">
                      <img src="${project.main_image || ''}" data-full-image="${project.full_image || ''}" alt="${project.title || 'Project image'}" class="project-image">
                    </div>
                    <div class="project-info">
                      <div class="basic-text title">${project.title || ''}</div>
                      <div class="basic-text tagline">${[project.medium, project.year].filter(Boolean).join(', ')}</div>
                      <div class="basic-text text">${project.description || ''}</div>
                      <br>
                      <div class="basic-text tagline">* Click image for full view</div>
                      <div class="basic-text tagline"><span class="bold">Learn more: </span><a href="${project.related_link || '#'}" target="_blank" rel="noopener noreferrer">related link</a></div>
                    </div>
                  </div>
                </div>
            `).join('');

            thumbTrack.innerHTML = projects.map((project, index) => `
                <img src="${project.thumbnail || ''}" alt="${project.title || ''} thumbnail" data-index="${index}" class="thumb${index === 0 ? ' active' : ''}" loading="lazy">
            `).join('');
        };

        async function loadProjects() {
            if (!projectTrack || !thumbTrack) return;

            try {
                const response = await fetch(PROJECTS_ENDPOINT);
                if (!response.ok) throw new Error(`Failed to fetch projects: ${response.status}`);
                const payload = await response.json();

                const projects = getProjectsFromResponse(payload)
                    .filter(project => normalizeBoolean(project.visible))
                    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

                if (projects.length === 0) {
                    projectTrack.innerHTML = '<div class="basic-text text">No visible projects found.</div>';
                    thumbTrack.innerHTML = '';
                    return;
                }

                renderProjectSlides(projects);
                initializeProjectsCarousel();
            } catch (error) {
                console.error(error);
                projectTrack.innerHTML = '<div class="basic-text text">Unable to load projects right now.</div>';
                thumbTrack.innerHTML = '';
            }
        }

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
            loadProjects();
        }

        function initializeProjectsCarousel() {
            if (!projectTrack || !projectPrevBtn || !projectNextBtn) return;
            projectSlides = Array.from(projectTrack.children);
            if (projectSlides.length === 0) return;
            projectCurrentIndex = 0;
            updateProjectsCarousel();

            const existingThumbs = Array.from(thumbTrack.querySelectorAll('.thumb'));
            existingThumbs.forEach(t => {
                const clone = t.cloneNode(true);
                t.replaceWith(clone);
            });

            const refreshedThumbs = Array.from(thumbTrack.querySelectorAll('.thumb'));

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
