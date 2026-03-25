import api from './api';

export const fileService = {
    /**
     * Upload laboratory logo
     * @param {File} file - Image file (JPG/PNG, max 1MB)
     * @param {string} organizationId - Optional organization ID
     * @returns {Promise<string>} File URL
     */
    async uploadLogo(file, organizationId = null) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const url = organizationId 
                ? `/files/upload/logo?organization_id=${organizationId}` 
                : '/files/upload/logo';
                
            const response = await api.post(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.file_url;
        } catch (error) {
            const message = error.message || 'Logo upload failed';
            throw new Error(message);
        }
    },

    /**
     * Upload document (PDF, Word, Excel, etc.)
     * @param {File} file - Document file
     * @param {string} docType - Document type
     * @param {string} organizationId - Optional organization ID
     * @returns {Promise<string>} File URL
     */
    async uploadDocument(file, docType = 'general', organizationId = null) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            let url = `/files/upload/document?doc_type=${docType}`;
            if (organizationId) {
                url += `&organization_id=${organizationId}`;
            }

            const response = await api.post(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.file_url;
        } catch (error) {
            const message = error.message || 'Document upload failed';
            throw new Error(message);
        }
    },

    /**
     * Upload multiple documents
     * @param {File[]} files - Array of document files
     * @param {string} docType - Document type
     * @param {string} organizationId - Optional organization ID
     * @returns {Promise<Array>} Array of file URLs
     */
    async uploadMultiple(files, docType = 'general', organizationId = null) {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files', file);
        });

        try {
            let url = `/files/upload/multiple?doc_type=${docType}`;
            if (organizationId) {
                url += `&organization_id=${organizationId}`;
            }

            const response = await api.post(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.files.map((f) => f.file_url);
        } catch (error) {
            const message = error.message || 'Multiple file upload failed';
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
            await api.delete('/files/delete', {
                params: { file_url: fileUrl },
            });
            return true;
        } catch (error) {
            const message = error.message || 'File deletion failed';
            throw new Error(message);
        }
    },
};

export default fileService;
