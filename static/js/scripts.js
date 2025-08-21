// ===== CAREBRIDGE JAVASCRIPT UTILITIES =====

// ===== GLOBAL VARIABLES =====
let currentUser = null;
let allPatients = [];
let allDoctors = [];
let allMappings = [];

// ===== AUTHENTICATION UTILITIES =====

/**
 * Get JWT token from localStorage
 */
function getAuthToken() {
    return localStorage.getItem('access');
}

/**
 * Get refresh token from localStorage
 */
function getRefreshToken() {
    return localStorage.getItem('refresh');
}

/**
 * Check if user is authenticated
 */
function checkAuthentication() {
    const token = getAuthToken();
    if (!token) {
        showToast('Please login first', 'error');
        window.location.href = '/login/';
        return false;
    }
    return true;
}

/**
 * Refresh JWT token
 */
async function refreshAuthToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        logout();
        return false;
    }
    
    try {
        const response = await fetch('/api/token/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refresh: refreshToken
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('access', data.access);
            return true;
        } else {
            logout();
            return false;
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
        logout();
        return false;
    }
}

/**
 * Logout user
 */
function logout() {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('username');
    showToast('Logged out successfully', 'info');
    window.location.href = '/login/';
}

/**
 * Check authentication status and update navbar
 */
function checkAuthStatus() {
    const token = getAuthToken();
    const authenticatedLinks = document.getElementById('authenticated-links');
    const authenticatedSection = document.getElementById('authenticated-section');
    const unauthenticatedSection = document.getElementById('unauthenticated-section');
    const usernameDisplay = document.getElementById('username-display');
    const heroAuth = document.getElementById('hero-authenticated');
    const heroUnauth = document.getElementById('hero-unauthenticated');
    
    if (token) {
        // Show authenticated elements
        if (authenticatedLinks) {
            authenticatedLinks.classList.remove('hidden');
        }
        if (authenticatedSection) {
            authenticatedSection.classList.remove('hidden');
        }
        if (unauthenticatedSection) {
            unauthenticatedSection.classList.add('hidden');
        }
        if (heroAuth) {
            heroAuth.style.display = 'flex';
        }
        if (heroUnauth) {
            heroUnauth.style.display = 'none';
        }
        
        // Get username from localStorage
        const username = localStorage.getItem('username') || 'User';
        if (usernameDisplay) {
            usernameDisplay.textContent = username;
        }
    } else {
        // Show unauthenticated elements
        if (authenticatedLinks) {
            authenticatedLinks.classList.add('hidden');
        }
        if (authenticatedSection) {
            authenticatedSection.classList.add('hidden');
        }
        if (unauthenticatedSection) {
            unauthenticatedSection.classList.remove('hidden');
        }
        if (heroAuth) {
            heroAuth.style.display = 'none';
        }
        if (heroUnauth) {
            heroUnauth.style.display = 'flex';
        }
    }
}

// ===== API UTILITIES =====

/**
 * Make authenticated API request
 */
async function makeAuthenticatedRequest(url, options = {}) {
    if (!checkAuthentication()) return null;
    
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    };
    
    const requestOptions = { ...defaultOptions, ...options };
    
    try {
        let response = await fetch(url, requestOptions);
        
        // If token expired, try to refresh
        if (response.status === 401) {
            const refreshed = await refreshAuthToken();
            if (refreshed) {
                requestOptions.headers.Authorization = `Bearer ${getAuthToken()}`;
                response = await fetch(url, requestOptions);
            } else {
                return null;
            }
        }
        
        return response;
    } catch (error) {
        console.error('API request failed:', error);
        showToast('Network error: ' + error.message, 'error');
        return null;
    }
}

// ===== TOAST NOTIFICATIONS =====

/**
 * Show toast notification
 */
function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    toast.innerHTML = `
        <span class="toast-text">${message}</span>
        <button class="toast-close" onclick="removeToast(this)" aria-label="Close notification">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove after duration
    setTimeout(() => {
        removeToast(toast);
    }, duration);
}

/**
 * Remove toast notification
 */
function removeToast(element) {
    const toast = element.classList && element.classList.contains('toast') ? element : element.closest('.toast');
    if (toast) {
        toast.style.animation = 'fadeOut 0.3s ease-in-out';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// ===== FORM UTILITIES =====

/**
 * Handle form submission with loading state
 */
async function handleFormSubmission(formElement, submitHandler) {
    const submitButton = formElement.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    // Set loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Loading...';
    
    try {
        await submitHandler();
    } catch (error) {
        console.error('Form submission error:', error);
        showToast('An error occurred. Please try again.', 'error');
    } finally {
        // Reset button state
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

/**
 * Validate form data
 */
function validateFormData(data, requiredFields) {
    const errors = [];
    
    requiredFields.forEach(field => {
        if (!data[field] || data[field].trim() === '') {
            errors.push(`${field.replace('_', ' ')} is required`);
        }
    });
    
    return errors;
}

/**
 * Reset form and hide it
 */
function resetAndHideForm(formId, containerId) {
    const form = document.getElementById(formId);
    const container = document.getElementById(containerId);
    
    if (form) form.reset();
    if (container) container.classList.add('hidden');
}

// ===== PATIENT UTILITIES =====

/**
 * Load patients from API
 */
async function loadPatients() {
    if (!checkAuthentication()) return;
    
    try {
        const response = await makeAuthenticatedRequest('/api/patients/');
        
        if (response && response.ok) {
            allPatients = await response.json();
            console.log('Loaded patients:', allPatients);
            
            // Update UI if display function exists
            if (typeof displayPatients === 'function') {
                displayPatients(allPatients);
            }
            
            // Update patient selects if populate function exists
            if (typeof populatePatientSelects === 'function') {
                populatePatientSelects();
            }
            
            return allPatients;
        } else {
            throw new Error('Failed to load patients');
        }
    } catch (error) {
        console.error('Error loading patients:', error);
        showToast('Error loading patients', 'error');
        
        const container = document.getElementById('patientsList');
        if (container) {
            container.innerHTML = '<p class="error-text">Failed to load patients. Please try again.</p>';
        }
        return [];
    }
}

/**
 * Create new patient
 */
async function createPatient(patientData) {
    if (!checkAuthentication()) return false;
    
    try {
        const response = await makeAuthenticatedRequest('/api/patients/', {
            method: 'POST',
            body: JSON.stringify(patientData)
        });
        
        if (response && response.ok) {
            const newPatient = await response.json();
            allPatients.push(newPatient);
            showToast('Patient created successfully!', 'success');
            
            // Reload patients list
            if (typeof displayPatients === 'function') {
                displayPatients(allPatients);
            }
            
            return true;
        } else {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to create patient');
        }
    } catch (error) {
        console.error('Error creating patient:', error);
        showToast('Error creating patient: ' + error.message, 'error');
        return false;
    }
}

/**
 * Update patient
 */
async function updatePatient(patientId, patientData) {
    if (!checkAuthentication()) return false;
    
    try {
        const response = await makeAuthenticatedRequest(`/api/patients/${patientId}/`, {
            method: 'PUT',
            body: JSON.stringify(patientData)
        });
        
        if (response && response.ok) {
            const updatedPatient = await response.json();
            const index = allPatients.findIndex(p => p.id === patientId);
            if (index !== -1) {
                allPatients[index] = updatedPatient;
            }
            showToast('Patient updated successfully!', 'success');
            return updatedPatient;
        } else {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to update patient');
        }
    } catch (error) {
        console.error('Error updating patient:', error);
        showToast('Error updating patient: ' + error.message, 'error');
        return false;
    }
}

/**
 * Get patient by ID
 */
async function getPatient(patientId) {
    if (!checkAuthentication()) return null;
    
    try {
        const response = await makeAuthenticatedRequest(`/api/patients/${patientId}/`);
        
        if (response && response.ok) {
            return await response.json();
        } else {
            throw new Error('Patient not found');
        }
    } catch (error) {
        console.error('Error loading patient:', error);
        showToast('Error loading patient details', 'error');
        return null;
    }
}

/**
 * Display patients in grid
 */
function displayPatients(patients) {
    const container = document.getElementById('patientsList');
    if (!container) return;
    
    if (!patients || patients.length === 0) {
        container.innerHTML = `
            <div class="text-center">
                <p class="loading-text">No patients found.</p>
                <button onclick="toggleCreateForm('createPatientForm')" class="link">Create your first patient</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = patients.map(patient => `
        <div class="data-card" onclick="viewPatient('${patient.id}')">
            <h3 class="data-card-title">${patient.first_name} ${patient.last_name}</h3>
            <p class="data-card-info">DOB: ${patient.dob || 'N/A'}</p>
            <p class="data-card-info">Gender: ${getGenderDisplay(patient.gender)}</p>
            <p class="data-card-info">Phone: ${patient.phone || 'N/A'}</p>
            <p class="data-card-info">Blood Group: ${patient.blood_group || 'N/A'}</p>
        </div>
    `).join('');
}

/**
 * Navigate to patient details
 */
function viewPatient(patientId) {
    window.location.href = `/patient-details/${patientId}/`;
}

// ===== DOCTOR UTILITIES =====

/**
 * Load doctors from API
 */
async function loadDoctors() {
    if (!checkAuthentication()) return;
    
    try {
        const response = await makeAuthenticatedRequest('/api/doctors/');
        
        if (response && response.ok) {
            allDoctors = await response.json();
            console.log('Loaded doctors:', allDoctors);
            
            // Update UI if display function exists
            if (typeof displayDoctors === 'function') {
                displayDoctors(allDoctors);
            }
            
            // Update doctor selects if populate function exists
            if (typeof populateDoctorSelects === 'function') {
                populateDoctorSelects();
            }
            
            return allDoctors;
        } else {
            throw new Error('Failed to load doctors');
        }
    } catch (error) {
        console.error('Error loading doctors:', error);
        showToast('Error loading doctors', 'error');
        
        const container = document.getElementById('doctorsList');
        if (container) {
            container.innerHTML = '<p class="error-text">Failed to load doctors. Please try again.</p>';
        }
        return [];
    }
}

/**
 * Create new doctor
 */
async function createDoctor(doctorData) {
    if (!checkAuthentication()) return false;
    
    try {
        const response = await makeAuthenticatedRequest('/api/doctors/', {
            method: 'POST',
            body: JSON.stringify(doctorData)
        });
        
        if (response && response.ok) {
            const newDoctor = await response.json();
            allDoctors.push(newDoctor);
            showToast('Doctor created successfully!', 'success');
            
            // Reload doctors list
            if (typeof displayDoctors === 'function') {
                displayDoctors(allDoctors);
            }
            
            return true;
        } else {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to create doctor');
        }
    } catch (error) {
        console.error('Error creating doctor:', error);
        showToast('Error creating doctor: ' + error.message, 'error');
        return false;
    }
}

/**
 * Update doctor
 */
async function updateDoctor(doctorId, doctorData) {
    if (!checkAuthentication()) return false;
    
    try {
        const response = await makeAuthenticatedRequest(`/api/doctors/${doctorId}/`, {
            method: 'PUT',
            body: JSON.stringify(doctorData)
        });
        
        if (response && response.ok) {
            const updatedDoctor = await response.json();
            const index = allDoctors.findIndex(d => d.id === doctorId);
            if (index !== -1) {
                allDoctors[index] = updatedDoctor;
            }
            showToast('Doctor updated successfully!', 'success');
            return updatedDoctor;
        } else {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to update doctor');
        }
    } catch (error) {
        console.error('Error updating doctor:', error);
        showToast('Error updating doctor: ' + error.message, 'error');
        return false;
    }
}

/**
 * Get doctor by ID
 */
async function getDoctor(doctorId) {
    if (!checkAuthentication()) return null;
    
    try {
        const response = await makeAuthenticatedRequest(`/api/doctors/${doctorId}/`);
        
        if (response && response.ok) {
            return await response.json();
        } else {
            throw new Error('Doctor not found');
        }
    } catch (error) {
        console.error('Error loading doctor:', error);
        showToast('Error loading doctor details', 'error');
        return null;
    }
}

/**
 * Display doctors in grid
 */
function displayDoctors(doctors) {
    const container = document.getElementById('doctorsList');
    if (!container) return;
    
    if (!doctors || doctors.length === 0) {
        container.innerHTML = `
            <div class="text-center">
                <p class="loading-text">No doctors found.</p>
                <button onclick="toggleCreateForm('createDoctorForm')" class="link">Create your first doctor</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = doctors.map(doctor => `
        <div class="data-card" onclick="viewDoctor('${doctor.id}')">
            <h3 class="data-card-title">Dr. ${doctor.full_name}</h3>
            <p class="data-card-info">Specialization: ${doctor.specialization}</p>
            <p class="data-card-info">Experience: ${doctor.years_experience} years</p>
            <p class="data-card-info">Email: ${doctor.email}</p>
            <p class="data-card-info">Phone: ${doctor.phone}</p>
            <p class="data-card-info">Hospital: ${doctor.hospital_affiliation || 'N/A'}</p>
        </div>
    `).join('');
}

/**
 * Navigate to doctor details
 */
function viewDoctor(doctorId) {
    window.location.href = `/doctor-details/${doctorId}/`;
}

// ===== MAPPING UTILITIES =====

/**
 * Load mappings from API
 */
async function loadMappings() {
    if (!checkAuthentication()) return;
    
    try {
        const response = await makeAuthenticatedRequest('/api/mappings/');
        
        if (response && response.ok) {
            allMappings = await response.json();
            console.log('Loaded mappings:', allMappings);
            
            // Update UI if display function exists
            if (typeof displayMappings === 'function') {
                displayMappings(allMappings);
            }
            
            return allMappings;
        } else {
            throw new Error('Failed to load mappings');
        }
    } catch (error) {
        console.error('Error loading mappings:', error);
        showToast('Error loading mappings', 'error');
        
        const container = document.getElementById('mappingsList');
        if (container) {
            container.innerHTML = '<p class="error-text">Failed to load mappings. Please try again.</p>';
        }
        return [];
    }
}

/**
 * Create new mapping
 */
async function createMapping(mappingData) {
    if (!checkAuthentication()) return false;
    
    try {
        const response = await makeAuthenticatedRequest('/api/mappings/', {
            method: 'POST',
            body: JSON.stringify(mappingData)
        });
        
        if (response && response.ok) {
            const newMapping = await response.json();
            allMappings.push(newMapping);
            showToast('Doctor assigned successfully!', 'success');
            
            // Reload mappings list
            if (typeof displayMappings === 'function') {
                displayMappings(allMappings);
            }
            
            return true;
        } else {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to create assignment');
        }
    } catch (error) {
        console.error('Error creating mapping:', error);
        showToast('Error creating assignment: ' + error.message, 'error');
        return false;
    }
}

/**
 * Delete mapping
 */
async function deleteMapping(mappingId) {
    if (!confirm('Are you sure you want to remove this assignment?')) return false;
    if (!checkAuthentication()) return false;
    
    try {
        const response = await makeAuthenticatedRequest(`/api/mappings/${mappingId}/`, {
            method: 'DELETE'
        });
        
        if (response && response.ok) {
            allMappings = allMappings.filter(m => m.id !== mappingId);
            showToast('Assignment removed successfully!', 'success');
            
            // Update UI
            if (typeof displayMappings === 'function') {
                displayMappings(allMappings);
            }
            
            return true;
        } else {
            throw new Error('Failed to remove assignment');
        }
    } catch (error) {
        console.error('Error deleting mapping:', error);
        showToast('Error removing assignment: ' + error.message, 'error');
        return false;
    }
}

/**
 * Display mappings
 */
function displayMappings(mappings) {
    const container = document.getElementById('mappingsList');
    const countElement = document.getElementById('mappingsCount');
    
    if (!container) return;
    
    if (countElement) {
        countElement.textContent = `${mappings.length} assignment(s)`;
    }
    
    if (!mappings || mappings.length === 0) {
        container.innerHTML = `
            <div class="text-center">
                <p class="loading-text">No assignments found.</p>
                <button onclick="toggleCreateForm('createMappingForm')" class="link">Create your first assignment</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = mappings.map(mapping => {
        const patient = allPatients.find(p => p.id === mapping.patient);
        const doctor = allDoctors.find(d => d.id === mapping.doctor);
        
        return `
            <div class="mapping-card">
                <div class="mapping-content">
                    <div class="mapping-info">
                        <div class="mapping-info-grid">
                            <div class="mapping-section">
                                <div class="mapping-section-title">Patient</div>
                                <div class="mapping-section-name">${patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient'}</div>
                                <div class="mapping-section-detail">${patient ? patient.phone : ''}</div>
                            </div>
                            <div class="mapping-section">
                                <div class="mapping-section-title">Doctor</div>
                                <div class="mapping-section-name">Dr. ${doctor ? doctor.full_name : 'Unknown Doctor'}</div>
                                <div class="mapping-section-detail">${doctor ? doctor.specialization : ''}</div>
                            </div>
                            <div class="mapping-section">
                                <div class="mapping-section-title">Assignment Details</div>
                                <div class="mapping-section-detail">Type: ${mapping.relationship_type || 'General'}</div>
                                <div class="mapping-section-detail">Assigned: ${new Date(mapping.assigned_at).toLocaleDateString()}</div>
                                ${mapping.notes ? `<div class="mapping-section-detail">Notes: ${mapping.notes}</div>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="mapping-actions">
                        <button onclick="viewPatientDetails('${mapping.patient}')" class="btn btn-primary btn-small">
                            View Patient
                        </button>
                        <button onclick="viewDoctorDetails('${mapping.doctor}')" class="btn btn-success btn-small">
                            View Doctor
                        </button>
                        <button onclick="deleteMapping('${mapping.id}')" class="btn btn-danger btn-small">
                            Remove
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Navigate to patient details from mapping
 */
function viewPatientDetails(patientId) {
    window.location.href = `/patient-details/${patientId}/`;
}

/**
 * Navigate to doctor details from mapping
 */
function viewDoctorDetails(doctorId) {
    window.location.href = `/doctor-details/${doctorId}/`;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Toggle visibility of create forms
 */
function toggleCreateForm(formId) {
    if (!checkAuthentication()) return;
    
    const form = document.getElementById(formId);
    if (form) {
        form.classList.toggle('hidden');
    }
}

/**
 * Get gender display text
 */
function getGenderDisplay(genderCode) {
    const genderMap = {
        'M': 'Male',
        'F': 'Female',
        'O': 'Other',
        'U': 'Unknown'
    };
    return genderMap[genderCode] || 'Unknown';
}

/**
 * Get ID from URL path
 */
function getIdFromUrl() {
    const path = window.location.pathname;
    const segments = path.split('/');
    return segments[segments.length - 2];
}

/**
 * Populate patient select dropdowns
 */
function populatePatientSelects() {
    const selects = document.querySelectorAll('select[name="patient"], #filterPatient');
    
    selects.forEach(select => {
        const isFilter = select.id && select.id.includes('filter');
        const defaultOption = isFilter ? 'All Patients' : 'Select Patient';
        
        select.innerHTML = `<option value="">${defaultOption}</option>`;
        
        allPatients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.id;
            option.textContent = `${patient.first_name} ${patient.last_name}`;
            select.appendChild(option);
        });
    });
}

/**
 * Populate doctor select dropdowns
 */
function populateDoctorSelects() {
    const selects = document.querySelectorAll('select[name="doctor"], #filterDoctor');
    
    selects.forEach(select => {
        const isFilter = select.id && select.id.includes('filter');
        const defaultOption = isFilter ? 'All Doctors' : 'Select Doctor';
        
        select.innerHTML = `<option value="">${defaultOption}</option>`;
        
        allDoctors.forEach(doctor => {
            const option = document.createElement('option');
            option.value = doctor.id;
            option.textContent = `Dr. ${doctor.full_name} (${doctor.specialization})`;
            select.appendChild(option);
        });
    });
}

/**
 * Filter mappings based on criteria
 */
function filterMappings() {
    const patientFilter = document.getElementById('filterPatient')?.value || '';
    const doctorFilter = document.getElementById('filterDoctor')?.value || '';
    const relationshipFilter = document.getElementById('filterRelationship')?.value || '';
    
    let filteredMappings = allMappings;
    
    if (patientFilter) {
        filteredMappings = filteredMappings.filter(m => m.patient === patientFilter);
    }
    
    if (doctorFilter) {
        filteredMappings = filteredMappings.filter(m => m.doctor === doctorFilter);
    }
    
    if (relationshipFilter) {
        filteredMappings = filteredMappings.filter(m => m.relationship_type === relationshipFilter);
    }
    
    displayMappings(filteredMappings);
}

/**
 * Initialize page based on current URL
 */
function initializePage() {
    const path = window.location.pathname;
    
    // Check authentication status
    checkAuthStatus();
    
    // Page-specific initialization
    if (path.includes('/patients/')) {
        loadPatients();
    } else if (path.includes('/doctors/')) {
        loadDoctors();
    } else if (path.includes('/mappings/')) {
        loadPatients().then(() => {
            loadDoctors().then(() => {
                loadMappings();
            });
        });
    } else if (path.includes('/patient-details/')) {
        const patientId = getIdFromUrl();
        loadPatientDetails(patientId);
    } else if (path.includes('/doctor-details/')) {
        const doctorId = getIdFromUrl();
        loadDoctorDetails(doctorId);
    }
}

/**
 * Load patient details for details page
 */
async function loadPatientDetails(patientId) {
    const patient = await getPatient(patientId);
    if (patient && typeof displayPatientDetails === 'function') {
        displayPatientDetails(patient);
        if (typeof populateEditForm === 'function') {
            populateEditForm(patient);
        }
    }
}

/**
 * Load doctor details for details page
 */
async function loadDoctorDetails(doctorId) {
    const doctor = await getDoctor(doctorId);
    if (doctor && typeof displayDoctorDetails === 'function') {
        displayDoctorDetails(doctor);
        if (typeof populateEditForm === 'function') {
            populateEditForm(doctor);
        }
    }
}

// ===== EVENT LISTENERS =====

/**
 * Initialize application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize page
    initializePage();
    
    // Set up common event listeners
    setupCommonEventListeners();
});

/**
 * Set up common event listeners
 */
function setupCommonEventListeners() {
    // Handle login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Handle register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Handle patient form
    const patientForm = document.getElementById('patientForm');
    if (patientForm) {
        patientForm.addEventListener('submit', handlePatientCreate);
    }
    
    // Handle doctor form
    const doctorForm = document.getElementById('doctorForm');
    if (doctorForm) {
        doctorForm.addEventListener('submit', handleDoctorCreate);
    }
    
    // Handle mapping form
    const mappingForm = document.getElementById('mappingForm');
    if (mappingForm) {
        mappingForm.addEventListener('submit', handleMappingCreate);
    }
    
    // Handle patient edit form
    const patientEditForm = document.getElementById('patientEditForm');
    if (patientEditForm) {
        patientEditForm.addEventListener('submit', handlePatientUpdate);
    }
    
    // Handle doctor edit form
    const doctorEditForm = document.getElementById('doctorEditForm');
    if (doctorEditForm) {
        doctorEditForm.addEventListener('submit', handleDoctorUpdate);
    }
    
    // Set up filter listeners
    const filterElements = ['filterPatient', 'filterDoctor', 'filterRelationship'];
    filterElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', filterMappings);
        }
    });
    
    // Set up create button listeners
    setupCreateButtonListeners();
    
    // Set up cancel button listeners
    setupCancelButtonListeners();
    
    // Set up edit/cancel edit listeners
    setupEditButtonListeners();
}

/**
 * Set up create button listeners
 */
function setupCreateButtonListeners() {
    const createButtons = [
        { id: 'createPatientBtn', formId: 'createPatientForm' },
        { id: 'createDoctorBtn', formId: 'createDoctorForm' },
        { id: 'createMappingBtn', formId: 'createMappingForm' }
    ];
    
    createButtons.forEach(({ id, formId }) => {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', () => toggleCreateForm(formId));
        }
    });
}

/**
 * Set up cancel button listeners
 */
function setupCancelButtonListeners() {
    const cancelButtons = [
        { id: 'cancelPatientForm', formId: 'patientForm', containerId: 'createPatientForm' },
        { id: 'cancelDoctorForm', formId: 'doctorForm', containerId: 'createDoctorForm' },
        { id: 'cancelMappingForm', formId: 'mappingForm', containerId: 'createMappingForm' },
        { id: 'cancelEditPatient', formId: 'patientEditForm', containerId: 'editPatientForm' },
        { id: 'cancelEditDoctor', formId: 'doctorEditForm', containerId: 'editDoctorForm' }
    ];
    
    cancelButtons.forEach(({ id, formId, containerId }) => {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', () => resetAndHideForm(formId, containerId));
        }
    });
}

/**
 * Set up edit button listeners
 */
function setupEditButtonListeners() {
    const editPatientBtn = document.getElementById('editPatientBtn');
    if (editPatientBtn) {
        editPatientBtn.addEventListener('click', function() {
            document.getElementById('patientDetailsView')?.classList.add('hidden');
            document.getElementById('editPatientForm')?.classList.remove('hidden');
        });
    }
    
    const editDoctorBtn = document.getElementById('editDoctorBtn');
    if (editDoctorBtn) {
        editDoctorBtn.addEventListener('click', function() {
            document.getElementById('doctorDetailsView')?.classList.add('hidden');
            document.getElementById('editDoctorForm')?.classList.remove('hidden');
        });
    }
    
    const cancelEditPatient = document.getElementById('cancelEditPatient');
    if (cancelEditPatient) {
        cancelEditPatient.addEventListener('click', function() {
            document.getElementById('editPatientForm')?.classList.add('hidden');
            document.getElementById('patientDetailsView')?.classList.remove('hidden');
        });
    }
    
    const cancelEditDoctor = document.getElementById('cancelEditDoctor');
    if (cancelEditDoctor) {
        cancelEditDoctor.addEventListener('click', function() {
            document.getElementById('editDoctorForm')?.classList.add('hidden');
            document.getElementById('doctorDetailsView')?.classList.remove('hidden');
        });
    }
}

// ===== FORM HANDLERS =====

/**
 * Handle login form submission
 */
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error-message');
    const errorText = errorDiv?.querySelector('p');
    
    // Hide previous errors
    if (errorDiv) errorDiv.classList.add('hidden');
    
    await handleFormSubmission(e.target, async () => {
        const response = await fetch('/api/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('access', data.access);
            localStorage.setItem('refresh', data.refresh);
            localStorage.setItem('username', username);
            
            showToast('Login successful!', 'success');
            window.location.href = '/';
        } else {
            if (errorText) errorText.textContent = data.detail || 'Invalid username or password';
            if (errorDiv) errorDiv.classList.remove('hidden');
        }
    });
}

/**
 * Handle register form submission
 */
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error-message');
    const errorText = errorDiv?.querySelector('p');
    
    // Hide previous errors
    if (errorDiv) errorDiv.classList.add('hidden');
    
    await handleFormSubmission(e.target, async () => {
        // Register user
        const registerResponse = await fetch('/api/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const registerData = await registerResponse.json();
        
        if (registerResponse.ok) {
            // Auto-login after registration
            const loginResponse = await fetch('/api/token/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value
                },
                body: JSON.stringify({ username, password })
            });
            
            const loginData = await loginResponse.json();
            
            if (loginResponse.ok) {
                localStorage.setItem('access', loginData.access);
                localStorage.setItem('refresh', loginData.refresh);
                localStorage.setItem('username', username);
                
                showToast('Registration successful!', 'success');
                window.location.href = '/';
            } else {
                showToast('Registration successful! Please login.', 'success');
                window.location.href = '/login/';
            }
        } else {
            let errorMessage = 'Registration failed: ';
            if (registerData.username) {
                errorMessage += registerData.username.join(', ');
            } else if (registerData.email) {
                errorMessage += registerData.email.join(', ');
            } else if (registerData.password) {
                errorMessage += registerData.password.join(', ');
            } else {
                errorMessage += registerData.detail || 'Unknown error';
            }
            
            if (errorText) errorText.textContent = errorMessage;
            if (errorDiv) errorDiv.classList.remove('hidden');
        }
    });
}

/**
 * Handle patient creation
 */
async function handlePatientCreate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    await handleFormSubmission(e.target, async () => {
        const success = await createPatient(data);
        if (success) {
            resetAndHideForm('patientForm', 'createPatientForm');
        }
    });
}

/**
 * Handle doctor creation
 */
async function handleDoctorCreate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    await handleFormSubmission(e.target, async () => {
        const success = await createDoctor(data);
        if (success) {
            resetAndHideForm('doctorForm', 'createDoctorForm');
        }
    });
}

/**
 * Handle mapping creation
 */
async function handleMappingCreate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    await handleFormSubmission(e.target, async () => {
        const success = await createMapping(data);
        if (success) {
            resetAndHideForm('mappingForm', 'createMappingForm');
        }
    });
}

/**
 * Handle patient update
 */
async function handlePatientUpdate(e) {
    e.preventDefault();
    
    const patientId = getIdFromUrl();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    await handleFormSubmission(e.target, async () => {
        const updatedPatient = await updatePatient(patientId, data);
        if (updatedPatient) {
            document.getElementById('editPatientForm')?.classList.add('hidden');
            document.getElementById('patientDetailsView')?.classList.remove('hidden');
            loadPatientDetails(patientId);
        }
    });
}

/**
 * Handle doctor update
 */
async function handleDoctorUpdate(e) {
    e.preventDefault();
    
    const doctorId = getIdFromUrl();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    await handleFormSubmission(e.target, async () => {
        const updatedDoctor = await updateDoctor(doctorId, data);
        if (updatedDoctor) {
            document.getElementById('editDoctorForm')?.classList.add('hidden');
            document.getElementById('doctorDetailsView')?.classList.remove('hidden');
            loadDoctorDetails(doctorId);
        }
    });
}

// ===== GLOBAL EXPORTS =====
// Make functions available globally for onclick handlers
window.logout = logout;
window.toggleCreateForm = toggleCreateForm;
window.viewPatient = viewPatient;
window.viewDoctor = viewDoctor;
window.viewPatientDetails = viewPatientDetails;
window.viewDoctorDetails = viewDoctorDetails;
window.deleteMapping = deleteMapping;
window.filterMappings = filterMappings;
window.loadMappings = loadMappings;
window.removeToast = removeToast;