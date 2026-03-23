/**
 * File Upload Service
 * API calls for file upload and management
 */
import axios from 'axios';

const FILE_API_URL = import.meta.env.VITE_FILE_API_URL || 'http://127.0.0.1:8000/api/v1/files';

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
            const response = await axios.post(`${FILE_API_URL}/upload/logo`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
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
            const response = await axios.post(
                `${FILE_API_URL}/upload/document?doc_type=${docType}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
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
            const response = await axios.post(
                `${FILE_API_URL}/upload/multiple?doc_type=${docType}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
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
            await axios.delete(`${FILE_API_URL}/delete`, {
                params: { file_url: fileUrl },
            });
            return true;
        } catch (error) {
            const message = error.response?.data?.detail || 'File deletion failed';
            throw new Error(message);
        }
    },
};

export default fileService;
