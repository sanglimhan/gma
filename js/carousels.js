document.addEventListener('DOMContentLoaded', () => {
    const worksSection = document.getElementById('works');
    if (worksSection) {
        const worksTabButtons = worksSection.querySelectorAll('.menu-tab-btn');
        const worksTabContents = worksSection.querySelectorAll('.menu-tab-content');
        const projectTrack = document.getElementById('projectTrack');
        const thumbTrack = document.getElementById('thumbTrack');
        const publicationList = document.getElementById('publicationList');
        const projectPrevBtn = document.getElementById('projectPrevBtn');
        const projectNextBtn = document.getElementById('projectNextBtn');

        const PROJECTS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbylw7ICcjiNh8tZTtHw8hUYUrHT8yxGytQYlrnydEsCvY-aijCqH2wkoumHrQGETX8W/exec?sheet=projects';
        const PUBLICATIONS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbylw7ICcjiNh8tZTtHw8hUYUrHT8yxGytQYlrnydEsCvY-aijCqH2wkoumHrQGETX8W/exec?sheet=publications';

        let projectSlides = [];
        let projectCurrentIndex = 0;
        let syncThumbs = () => {};
        let hasActiveWorksLoadingState = false;
        let projectsLoadPromise = null;

        const notifyWorksLoadingState = (isLoading) => {
            const eventName = isLoading ? 'works:initial-loading-start' : 'works:initial-loading-complete';
            window.dispatchEvent(new CustomEvent(eventName));
        };

        const waitForNextPaint = () => new Promise((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(resolve));
        });

        const startWorksLoadingState = () => {
            if (hasActiveWorksLoadingState) return;
            hasActiveWorksLoadingState = true;
            notifyWorksLoadingState(true);
        };

        const hideWorksLoadingState = ({ force = false } = {}) => {
            if (!hasActiveWorksLoadingState && !force) return;
            hasActiveWorksLoadingState = false;
            notifyWorksLoadingState(false);
        };

        const isWorksContentReady = () => {
            if (!projectTrack) return false;

            const hasCachedSlides = projectSlides.length > 0;
            const hasRenderedTrackChildren = projectTrack.children.length > 0;
            const firstMainImage = projectTrack.querySelector('.project-slide .project-image');
            const isFirstMainImageLoaded = Boolean(
                firstMainImage
                && firstMainImage.getAttribute('src')
                && firstMainImage.complete
                && firstMainImage.naturalWidth > 0
            );

            return hasCachedSlides || hasRenderedTrackChildren || isFirstMainImageLoaded;
        };

        const waitForImageReady = (imageElement) => {
            if (!imageElement) return Promise.resolve();
            if (imageElement.complete && imageElement.naturalWidth > 0) {
                return Promise.resolve();
            }
            return new Promise((resolve) => {
                const cleanup = () => {
                    imageElement.removeEventListener('load', onLoad);
                    imageElement.removeEventListener('error', onError);
                };
                const onLoad = () => {
                    cleanup();
                    resolve();
                };
                const onError = () => {
                    cleanup();
                    resolve();
                };

                imageElement.addEventListener('load', onLoad, { once: true });
                imageElement.addEventListener('error', onError, { once: true });
            });
        };

        const loadProjectMainImage = (index) => {
            const targetSlide = projectSlides[index];
            if (!targetSlide) return;

            const targetImage = targetSlide.querySelector('.project-image');
            if (!targetImage || targetImage.getAttribute('src')) return;

            const mainImage = targetImage.dataset.mainImage || '';
            if (!mainImage) return;

            targetImage.src = mainImage;
            targetImage.loading = index === 0 ? 'eager' : 'lazy';
            if (index === 0) {
                targetImage.fetchPriority = 'high';
            }
        };

        const normalizeBoolean = (value) => {
            if (typeof value === 'boolean') return value;
            if (typeof value === 'number') return value !== 0;
            return String(value || '').toLowerCase() === 'true';
        };

        const escapeHtml = (value) => String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        const parseListField = (value) => String(value || '')
            .split(/[;,]/)
            .map(item => item.trim())
            .filter(Boolean);

        const getProjectsFromResponse = (payload) => {
            if (Array.isArray(payload)) return payload;
            if (Array.isArray(payload?.data)) return payload.data;
            if (Array.isArray(payload?.projects)) return payload.projects;
            if (Array.isArray(payload?.items)) return payload.items;
            return [];
        };

        const getGenericItemsFromResponse = (payload) => {
            if (Array.isArray(payload)) return payload;
            if (Array.isArray(payload?.data)) return payload.data;
            if (Array.isArray(payload?.items)) return payload.items;
            if (Array.isArray(payload?.publications)) return payload.publications;
            return [];
        };

        const getProjectId = (project, index) => String(project?.id || project?.project_id || `project-${index}`);

        const renderProjectSlides = (projects) => {
            if (!projectTrack || !thumbTrack) return;

            projectTrack.innerHTML = projects.map((project, index) => {
                const projectId = getProjectId(project, index);
                return `
                <div class="project-slide" data-project-id="${escapeHtml(projectId)}">
                  <div class="project-detail-layout">
                    <div class="project-image-wrapper">
                      <img ${index === 0 ? `src="${project.main_image || ''}" loading="eager" fetchpriority="high"` : ''} data-main-image="${project.main_image || ''}" data-full-image="${project.full_image || ''}" alt="${project.title || 'Project image'}" class="project-image">
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
            `;
            }).join('');

            thumbTrack.innerHTML = projects.map((project, index) => `
                <img src="${project.thumbnail || ''}" alt="${project.title || ''} thumbnail" data-index="${index}" data-project-id="${escapeHtml(getProjectId(project, index))}" class="thumb${index === 0 ? ' active' : ''}" loading="lazy">
            `).join('');
        };

        const formatHighlightedAuthors = (authors, highlightAuthors) => {
            const authorList = parseListField(authors);
            const highlightSet = new Set(parseListField(highlightAuthors).map(name => name.toLowerCase()));

            if (authorList.length === 0) return '';

            return authorList.map((name) => {
                const safeName = escapeHtml(name);
                return highlightSet.has(name.toLowerCase()) ? `<span class="bold">${safeName}</span>` : safeName;
            }).join(', ');
        };

        const renderPublications = (publications) => {
            if (!publicationList) return;

            publicationList.innerHTML = publications.map((publication) => {
                const title = escapeHtml(publication.title);
                const link = escapeHtml(publication.link);
                const authors = formatHighlightedAuthors(publication.authors, publication.highlight_authors);
                const venueYear = [publication.venue, publication.year].filter(Boolean).map(escapeHtml).join(', ');
                const keywords = escapeHtml(publication.keywords);

                return `
                <li class="list-item">
                  <span class="basic-text title"><a href="${link || '#'}" target="_blank" rel="noopener noreferrer">${title}</a></span>
                  <span class="basic-text text">${authors}</span>
                  <span class="basic-text subtitle">${venueYear}</span>
                  <span class="basic-text text"><span class="bold">Keyword: </span>${keywords}</span>
                </li>
                `;
            }).join('');
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

                const firstSlide = projectSlides[0];
                const firstImage = firstSlide?.querySelector('.project-image');
                await waitForImageReady(firstImage);
            } catch (error) {
                console.error(error);
                projectTrack.innerHTML = '<div class="basic-text text">Unable to load projects right now.</div>';
                thumbTrack.innerHTML = '';
            }
        }

        const loadProjectsOnce = async () => {
            if (isWorksContentReady()) {
                hideWorksLoadingState({ force: true });
                return;
            }

            if (projectsLoadPromise) return projectsLoadPromise;

            startWorksLoadingState();
            projectsLoadPromise = (async () => {
                await waitForNextPaint();
                await loadProjects();
            })();

            try {
                await projectsLoadPromise;
            } finally {
                projectsLoadPromise = null;
                hideWorksLoadingState({ force: true });
            }
        };

        async function loadPublications() {
            if (!publicationList) return;

            try {
                const response = await fetch(PUBLICATIONS_ENDPOINT);
                if (!response.ok) throw new Error(`Failed to fetch publications: ${response.status}`);
                const payload = await response.json();

                const publications = getGenericItemsFromResponse(payload)
                    .filter(item => normalizeBoolean(item.visible))
                    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

                if (publications.length === 0) {
                    publicationList.innerHTML = '<li class="list-item"><span class="basic-text text">No visible publications found.</span></li>';
                    return;
                }

                renderPublications(publications);
            } catch (error) {
                console.error(error);
                publicationList.innerHTML = '<li class="list-item"><span class="basic-text text">Unable to load publications right now.</span></li>';
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

        const activateProjectsOnFirstWorksVisit = () => {
            if (window.location.hash === '#works') {
                loadProjectsOnce();
            }
        };

        const worksNavLinks = document.querySelectorAll('a[href="#works"]');
        worksNavLinks.forEach((link) => {
            link.addEventListener('click', loadProjectsOnce);
        });

        window.addEventListener('hashchange', activateProjectsOnFirstWorksVisit);
        activateProjectsOnFirstWorksVisit();

        if (window.IntersectionObserver) {
            const worksActivationObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    loadProjectsOnce();
                    observer.unobserve(entry.target);
                });
            }, { threshold: 0.2 });
            worksActivationObserver.observe(worksSection);
        }

        loadPublications();

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
                    const clickedProjectId = String(t.dataset.projectId || '');
                    const targetIndex = projectSlides.findIndex(slide => String(slide.dataset.projectId || '') === clickedProjectId);
                    projectCurrentIndex = targetIndex >= 0 ? targetIndex : +t.dataset.index;
                    updateProjectsCarousel();
                    syncThumbs();
                });
            });
        }

        function updateProjectsCarousel() {
            if (projectSlides.length === 0) return;
            loadProjectMainImage(projectCurrentIndex);
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
        const PEOPLE_API_URL = 'https://script.google.com/macros/s/AKfycbwC2qCW-1fj0OaiZYdVjKmDBS47byiDxS7fR6BIfRVCi-ZMD2FI-xiaSpUEA5bDBG_-/exec';
        const peopleTabButtons = peopleSection.querySelectorAll('.menu-tab-btn');
        const peopleTabContents = peopleSection.querySelectorAll('.menu-tab-content');
        const piBio = document.getElementById('piBio');
        const studentTrack = document.getElementById('studentTrack');
        const studentPrevBtn = document.getElementById('studentPrevBtn');
        const studentNextBtn = document.getElementById('studentNextBtn');
        const alumniList = document.getElementById('alumniList');
        const collaboratorList = document.getElementById('collaboratorList');

        let studentCards = [];
        let studentCurrentIndex = 0;

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
                if (contentId === 'students') {
                    setTimeout(() => initialStudentTrack(), 100);
                }
            });
        });

        const normalizeVisibility = (value) => {
            if (typeof value === 'boolean') return value;
            if (typeof value === 'number') return value !== 0;
            const normalized = String(value || '').trim().toLowerCase();
            return normalized === 'true' || normalized === '1' || normalized === 'yes';
        };

        const getItemsFromResponse = (payload) => {
            if (Array.isArray(payload)) return payload;
            if (Array.isArray(payload?.data)) return payload.data;
            if (Array.isArray(payload?.items)) return payload.items;
            return [];
        };

        const preprocessPeopleItems = (items) => {
            if (!Array.isArray(items)) return [];

            const hasVisibleField = items.some(item => Object.prototype.hasOwnProperty.call(item || {}, 'visible'));
            const hasSortField = items.some(item => Object.prototype.hasOwnProperty.call(item || {}, 'sort_order'));

            let processedItems = [...items];

            if (hasVisibleField) {
                processedItems = processedItems.filter(item => normalizeVisibility(item?.visible));
            }

            if (hasSortField) {
                processedItems = processedItems.sort((a, b) => Number(a?.sort_order || 0) - Number(b?.sort_order || 0));
            }

            return processedItems;
        };

        const buildStudentCard = (student) => {
            const areas = [student.research_area_1, student.research_area_2, student.research_area_3]
                .map(area => String(area || '').trim())
                .filter(Boolean);

            const image = student.image || 'images/student-profile.png';
            const name = student.name || '';
            const program = student.program || '';
            const link = student.link || '';
            const infoMarkup = `
                <div class="student-image-wrapper">
                  <img src="${image}" alt="Profile of ${name || 'student'}" class="student-image">
                </div>
                <div class="student-info">
                  <div class="basic-text title">${name}</div>
                  <div class="basic-text subtitle">${program}</div>
                  <div class="basic-text text"><br>${areas.join('<br>')}</div>
                </div>
            `;

            return `
              <div class="student-card">
                ${link ? `<a href="${link}" target="_blank" rel="noopener noreferrer">${infoMarkup}</a>` : infoMarkup}
              </div>
            `;
        };

        const renderStudents = (students) => {
            if (!studentTrack) return;

            if (students.length === 0) {
                studentTrack.innerHTML = '<div class="basic-text text">No graduate students found.</div>';
                return;
            }

            studentTrack.innerHTML = students.map(buildStudentCard).join('');
            initialStudentTrack();
        };

        const renderAlumni = (alumni) => {
            if (!alumniList) return;
            alumniList.innerHTML = alumni.map((item) => {
                const name = item.name || '';
                const degreeYear = [item.degree, item.year].filter(Boolean).join(', ');
                const positionAtCompany = [item.current_position, item.company].filter(Boolean).join(' at ');
                const thesisTitle = item.thesis_title || '';
                const thesisLink = item.thesis_link || '';

                return `
                  <li class="people-item">
                    <div class="alumni-info">
                      <span class="people-text name">${name}</span>
                      <span class="people-text degree">${degreeYear ? `(${degreeYear})` : ''}</span>
                    </div>
                    <div class="alumni-details">
                      <div class="people-text affiliation">${positionAtCompany}</div>
                      <div class="thesis-link">
                        ${thesisLink ? `<a href="${thesisLink}" target="_blank" rel="noopener noreferrer">${thesisTitle}</a>` : thesisTitle}
                      </div>
                    </div>
                  </li>
                `;
            }).join('');
        };

        const renderCollaborators = (collaborators) => {
            if (!collaboratorList) return;
            collaboratorList.innerHTML = collaborators.map((item) => {
                const name = item.name || '';
                const positionAtCompany = [item.position, item.company].filter(Boolean).join(' at ');
                return `
                  <li class="people-item">
                    <span class="people-text name">${name}</span>
                    <span class="people-text affiliation">${positionAtCompany ? `— ${positionAtCompany}` : ''}</span>
                  </li>
                `;
            }).join('');
        };

        const renderPi = (piData) => {
            if (!piBio) return;
            const firstPi = piData[0] || {};
            piBio.textContent = firstPi.bio || '';
        };

        async function fetchPeopleSheet(sheet) {
            const response = await fetch(`${PEOPLE_API_URL}?sheet=${sheet}`);
            if (!response.ok) throw new Error(`Failed to fetch people (${sheet}): ${response.status}`);
            const payload = await response.json();
            return preprocessPeopleItems(getItemsFromResponse(payload));
        }

        async function loadPeople() {
            try {
                const [piData, studentsData, alumniData, collaboratorsData] = await Promise.all([
                    fetchPeopleSheet('PI'),
                    fetchPeopleSheet('GS'),
                    fetchPeopleSheet('Alum'),
                    fetchPeopleSheet('Collab')
                ]);

                renderPi(piData);
                renderStudents(studentsData);
                renderAlumni(alumniData);
                renderCollaborators(collaboratorsData);
            } catch (error) {
                console.error(error);
            }
        }

        const initialStudentTrack = () => {
            if (!studentTrack) return;
            studentCards = Array.from(studentTrack.children);
            studentCurrentIndex = 0;
            updateStudentCarousel();
        };

        const updateStudentCarousel = () => {
            if (!studentTrack || !studentPrevBtn || !studentNextBtn || studentCards.length === 0) return;
            const cardWidth = studentCards[0].offsetWidth;
            const gap = parseInt(window.getComputedStyle(studentTrack).gap) || 20;
            const moveAmount = studentCurrentIndex * (cardWidth + gap);
            studentTrack.style.transform = `translateX(-${moveAmount}px)`;
            studentPrevBtn.style.display = studentCurrentIndex === 0 ? 'none' : 'block';
            const wrapperWidth = studentTrack.parentElement.clientWidth;
            const trackWidth = studentTrack.scrollWidth;
            studentNextBtn.style.display = (moveAmount + wrapperWidth >= trackWidth - 1) ? 'none' : 'block';
        };

        if (studentTrack && studentPrevBtn && studentNextBtn) {
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

            window.addEventListener('resize', initialStudentTrack);
        }

        loadPeople();
    }


});
