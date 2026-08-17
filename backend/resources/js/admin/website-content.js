const initializeAdminWebsiteContent = () => {
    const page = document.querySelector('[data-admin-website-content]');

    if (!page) {
        return;
    }

    const endpoint = page.dataset.adminWebsiteContentEndpoint;
    const loading = page.querySelector('[data-content-loading]');
    const form = page.querySelector('[data-content-form]');
    const empty = page.querySelector('[data-content-empty]');
    const error = page.querySelector('[data-content-error]');
    const retry = page.querySelector('[data-content-retry]');
    const saveButton = page.querySelector('[data-content-save]');
    const saveLabel = page.querySelector('[data-content-save-label]');
    const success = page.querySelector('[data-content-success]');
    const validation = page.querySelector('[data-content-validation]');
    const imageInput = page.querySelector('[data-content-image-input]');

    if (!endpoint || !loading || !form || !empty || !error || !retry || !saveButton || !saveLabel || !success || !validation || !imageInput) {
        return;
    }

    const setLoadingState = (isLoading) => {
        page.setAttribute('aria-busy', String(isLoading));
        loading.classList.toggle('hidden', !isLoading);

        if (isLoading) {
            form.classList.add('hidden');
            empty.classList.add('hidden');
            error.classList.add('hidden');
        }
    };

    const setFieldValues = (selector, values) => {
        page.querySelectorAll(selector).forEach((field) => {
            const key = field.dataset.contentField ?? field.dataset.ctaField;
            field.value = values?.[key] ?? '';
        });
    };

    const populateHomepage = (homepage) => {
        const hero = homepage?.hero ?? {};
        const sections = homepage?.sections ?? {};
        const cta = homepage?.cta ?? {};

        setFieldValues('[data-content-field]', hero);
        setFieldValues('[data-cta-field]', cta);
        page.querySelectorAll('[data-homepage-section]').forEach((toggle) => {
            toggle.checked = Boolean(sections[toggle.dataset.homepageSection]);
        });

        empty.classList.toggle('hidden', Boolean(homepage));
        form.classList.remove('hidden');
    };

    const setSaveState = (isSaving) => {
        saveButton.disabled = isSaving;
        saveLabel.textContent = isSaving ? 'Saving...' : 'Save Changes';
    };

    const loadContent = async () => {
        setLoadingState(true);
        success.classList.add('hidden');
        validation.classList.add('hidden');
        retry.disabled = true;

        try {
            const response = await fetch(endpoint, {
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Website content request failed.');
            }

            const payload = await response.json();

            setLoadingState(false);
            populateHomepage(payload?.homepage ?? null);
        } catch (loadError) {
            setLoadingState(false);
            error.classList.remove('hidden');
        } finally {
            retry.disabled = false;
        }
    };

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        success.classList.add('hidden');
        validation.classList.add('hidden');

        const requiredFields = [...form.querySelectorAll('[required]')];
        const missingField = requiredFields.find((field) => !field.value.trim());

        if (missingField) {
            validation.textContent = 'Please complete all required homepage fields before saving.';
            validation.classList.remove('hidden');
            missingField.focus();
            return;
        }

        setSaveState(true);

        window.requestAnimationFrame(() => {
            setSaveState(false);
            success.classList.remove('hidden');
        });
    });

    imageInput.addEventListener('change', () => {
        const selectedFile = imageInput.files?.[0];

        if (!selectedFile) {
            return;
        }

        const placeholderText = page.querySelector('[data-content-image-placeholder] p');

        if (placeholderText) {
            placeholderText.textContent = `Selected image: ${selectedFile.name}`;
        }
    });

    retry.addEventListener('click', loadContent);
    loadContent();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminWebsiteContent);
} else {
    initializeAdminWebsiteContent();
}
