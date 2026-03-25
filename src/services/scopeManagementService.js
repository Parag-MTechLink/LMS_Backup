import { apiService } from './labManagementApi';

const BASE_URL = '/scope-management';

console.log('scopeManagementService.js initialized with BASE_URL:', BASE_URL);

const scopeManagementService = {
    // --- Composite Data ---
    getAllData: async () => {
        console.log('scopeManagementService.getAllData called');
        try {
            const response = await apiService.get(`${BASE_URL}/all`);
            console.log('scopeManagementService.getAllData success:', response);
            return response;
        } catch (error) {
            console.error('scopeManagementService.getAllData error:', error);
            throw error;
        }
    },

    // --- Global Settings ---
    updateSettings: async (data) => {
        console.log('scopeManagementService.updateSettings called', data);
        const response = await apiService.put(`${BASE_URL}/settings`, data);
        return response;
    },

    // --- ILC Programmes ---
    createILC: async (data) => {
        console.log('scopeManagementService.createILC called', data);
        const response = await apiService.post(`${BASE_URL}/ilc`, data);
        return response;
    },
    updateILC: async (id, data) => {
        console.log('scopeManagementService.updateILC called', id, data);
        const response = await apiService.put(`${BASE_URL}/ilc/${id}`, data);
        return response;
    },
    deleteILC: async (id) => {
        console.log('scopeManagementService.deleteILC called', id);
        const response = await apiService.delete(`${BASE_URL}/ilc/${id}`);
        return response;
    },

    // --- Lab Scope ---
    createScope: async (data) => {
        console.log('scopeManagementService.createScope called', data);
        const response = await apiService.post(`${BASE_URL}/scope`, data);
        return response;
    },
    updateScope: async (id, data) => {
        console.log('scopeManagementService.updateScope called', id, data);
        const response = await apiService.put(`${BASE_URL}/scope/${id}`, data);
        return response;
    },
    deleteScope: async (id) => {
        console.log('scopeManagementService.deleteScope called', id);
        const response = await apiService.delete(`${BASE_URL}/scope/${id}`);
        return response;
    },

    // --- Equipment ---
    createEquipment: async (data) => {
        console.log('scopeManagementService.createEquipment called', data);
        const response = await apiService.post(`${BASE_URL}/equipment`, data);
        return response;
    },
    updateEquipment: async (id, data) => {
        console.log('scopeManagementService.updateEquipment called', id, data);
        const response = await apiService.put(`${BASE_URL}/equipment/${id}`, data);
        return response;
    },
    deleteEquipment: async (id) => {
        console.log('scopeManagementService.deleteEquipment called', id);
        const response = await apiService.delete(`${BASE_URL}/equipment/${id}`);
        return response;
    },

    // --- Scope Tests ---
    createTest: async (data) => {
        console.log('scopeManagementService.createTest called', data);
        const response = await apiService.post(`${BASE_URL}/test`, data);
        return response;
    },
    updateTest: async (id, data) => {
        console.log('scopeManagementService.updateTest called', id, data);
        const response = await apiService.put(`${BASE_URL}/test/${id}`, data);
        return response;
    },
    deleteTest: async (id) => {
        console.log('scopeManagementService.deleteTest called', id);
        const response = await apiService.delete(`${BASE_URL}/test/${id}`);
        return response;
    },

    // --- Facilities Available ---
    createFacilityAvailable: async (data) => {
        console.log('scopeManagementService.createFacilityAvailable called', data);
        const response = await apiService.post(`${BASE_URL}/facility-available`, data);
        return response;
    },
    updateFacilityAvailable: async (id, data) => {
        console.log('scopeManagementService.updateFacilityAvailable called', id, data);
        const response = await apiService.put(`${BASE_URL}/facility-available/${id}`, data);
        return response;
    },
    deleteFacilityAvailable: async (id) => {
        console.log('scopeManagementService.deleteFacilityAvailable called', id);
        const response = await apiService.delete(`${BASE_URL}/facility-available/${id}`);
        return response;
    },

    // --- Facilities Not Available ---
    createFacilityNotAvailable: async (data) => {
        console.log('scopeManagementService.createFacilityNotAvailable called', data);
        const response = await apiService.post(`${BASE_URL}/facility-not-available`, data);
        return response;
    },
    updateFacilityNotAvailable: async (id, data) => {
        console.log('scopeManagementService.updateFacilityNotAvailable called', id, data);
        const response = await apiService.put(`${BASE_URL}/facility-not-available/${id}`, data);
        return response;
    },
    deleteFacilityNotAvailable: async (id) => {
        console.log('scopeManagementService.deleteFacilityNotAvailable called', id);
        const response = await apiService.delete(`${BASE_URL}/facility-not-available/${id}`);
        return response;
    },

    // --- Reference Material ---
    createReferenceMaterial: async (data) => {
        console.log('scopeManagementService.createReferenceMaterial called', data);
        const response = await apiService.post(`${BASE_URL}/reference-material`, data);
        return response;
    },
    updateReferenceMaterial: async (id, data) => {
        console.log('scopeManagementService.updateReferenceMaterial called', id, data);
        const response = await apiService.put(`${BASE_URL}/reference-material/${id}`, data);
        return response;
    },
    deleteReferenceMaterial: async (id) => {
        console.log('scopeManagementService.deleteReferenceMaterial called', id);
        const response = await apiService.delete(`${BASE_URL}/reference-material/${id}`);
        return response;
    },

    // --- Exclusions ---
    createExclusion: async (data) => {
        console.log('scopeManagementService.createExclusion called', data);
        const response = await apiService.post(`${BASE_URL}/exclusion`, data);
        return response;
    },
    updateExclusion: async (id, data) => {
        console.log('scopeManagementService.updateExclusion called', id, data);
        const response = await apiService.put(`${BASE_URL}/exclusion/${id}`, data);
        return response;
    },
    deleteExclusion: async (id) => {
        console.log('scopeManagementService.deleteExclusion called', id);
        const response = await apiService.delete(`${BASE_URL}/exclusion/${id}`);
        return response;
    },

    // --- Testing Charges ---
    createTestingCharge: async (data) => {
        console.log('scopeManagementService.createTestingCharge called', data);
        const response = await apiService.post(`${BASE_URL}/testing-charge`, data);
        return response;
    },
    updateTestingCharge: async (id, data) => {
        console.log('scopeManagementService.updateTestingCharge called', id, data);
        const response = await apiService.put(`${BASE_URL}/testing-charge/${id}`, data);
        return response;
    },
    deleteTestingCharge: async (id) => {
        console.log('scopeManagementService.deleteTestingCharge called', id);
        const response = await apiService.delete(`${BASE_URL}/testing-charge/${id}`);
        return response;
    },
};

export default scopeManagementService;
