/**
 * File Upload Service
 * API calls for file upload and management
 */
import axios from 'axios';
import { STORAGE_KEYS } from '../constants';

const FILE_API_URL = import.meta.env.VITE_FILE_API_URL || 'http://127.0.0.1:8001/api/v1/files';

export const fileService = {
    /**
     * Upload laboratory logo
     * @param {File} file - Image file (JPG/PNG, max 1MB)
     * @returns {Promise<string>} File URL
     */
    async uploadLogo(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem(STORAGE_KEYS.LAB_ACCESS_TOKEN);
            const response = await axios.post(`${FILE_API_URL}/upload/logo`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
            });

            return response.data.file_url;
        } catch (error) {
            const message = error.response?.data?.detail || 'Logo upload failed';
            throw new Error(message);
        }
    },

    /**
     * Upload document (PDF)
     * @param {File} file - PDF file (max 2MB)
     * @param {string} docType - Document type (general, compliance, policy, etc.)
     * @returns {Promise<string>} File URL
     */
    async uploadDocument(file, docType = 'general') {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem(STORAGE_KEYS.LAB_ACCESS_TOKEN);
            const response = await axios.post(
                `${FILE_API_URL}/upload/document`,
                formData,
                {
                    params: { doc_type: docType },
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': token ? `Bearer ${token}` : '',
                    },
                }
            );

            return response.data.file_url;
        } catch (error) {
            const message = error.response?.data?.detail || 'Document upload failed';
            throw new Error(message);
        }
    },

    /**
     * Upload multiple documents
     * @param {File[]} files - Array of PDF files
     * @param {string} docType - Document type
     * @returns {Promise<Array>} Array of file URLs
     */
    async uploadMultiple(files, docType = 'general') {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files', file);
        });

        try {
            const token = localStorage.getItem(STORAGE_KEYS.LAB_ACCESS_TOKEN);
            const response = await axios.post(
                `${FILE_API_URL}/upload/multiple`,
                formData,
                {
                    params: { doc_type: docType },
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': token ? `Bearer ${token}` : '',
                    },
                }
            );

            return response.data.files.map((f) => f.file_url);
        } catch (error) {
            const message = error.response?.data?.detail || 'Multiple file upload failed';
            throw new Error(message);
        }
    },

    /**
     * Delete a file
     * @param {string} fileUrl - URL of the file to delete
     * @returns {Promise<boolean>} Success status
     */
    async deleteFile(fileUrl) {
        try {
            const token = localStorage.getItem(STORAGE_KEYS.LAB_ACCESS_TOKEN);
            await axios.delete(`${FILE_API_URL}/delete`, {
                params: { file_url: fileUrl },
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                },
            });
            return true;
        } catch (error) {
            const message = error.response?.data?.detail || 'File deletion failed';
            throw new Error(message);
        }
    },
};

export default fileService;
