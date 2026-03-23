/**
 * Organization Details Integration Helper
 * Helper functions to integrate OrganizationDetails.jsx with the backend API
 */
import { organizationService } from './organizationService';
import { fileService } from './fileService';

/**
 * Map frontend formData to backend API format for each step
 */
export const organizationMapper = {
    /**
     * Step 1: Laboratory Details
     */
    mapLaboratoryDetails(formData) {
        return {
            lab_name: formData.labName,
            lab_address: formData.labAddress,
            lab_country: formData.labCountry,
            lab_state: formData.labState,
            lab_district: formData.labDistrict,
            lab_city: formData.labCity,
            lab_pin_code: formData.labPinCode,
            lab_logo_url: formData.labLogo,
            lab_proof_of_address: formData.labProofOfAddress,
            lab_proof_of_address_other: formData.labProofOfAddressOther,
            lab_document_id: formData.labDocumentId,
            lab_address_proof_url: formData.labAddressProofDocument,
        };
    },

    /**
     * Step 2: Registered Office & Top Management
     */
    mapRegisteredOffice(formData) {
        return {
            same_as_lab_address: formData.sameAsLabAddress,
            address: formData.registeredAddress,
            country: formData.registeredCountry,
            state: formData.registeredState,
            district: formData.registeredDistrict,
            city: formData.registeredCity,
            pin_code: formData.registeredPinCode,
            mobile: formData.registeredMobile,
            telephone: formData.registeredTelephone,
            fax: formData.registeredFax,
            top_management_document_url: formData.topManagementDocument,
            top_management: formData.topManagement.map((tm) => ({
                name: tm.name,
                designation: tm.designation,
                mobile: tm.mobile,
                telephone: tm.telephone,
                fax: tm.fax,
            })),
        };
    },

    /**
     * Step 3: Parent Organization
     */
    mapParentOrganization(formData) {
        return {
            same_as_laboratory: formData.sameAsLaboratory,
            name: formData.parentName,
            address: formData.parentAddress,
            country: formData.parentCountry,
            state: formData.parentState,
            district: formData.parentDistrict,
            city: formData.parentCity,
            pin_code: formData.parentPinCode,
        };
    },

    /**
     * Step 3: Bank Details
     */
    mapBankDetails(formData) {
        return {
            account_holder_name: formData.accountHolderName,
            account_number: formData.accountNumber,
            ifsc_code: formData.ifscCode,
            branch_name: formData.branchName,
            gst_number: formData.gstNumber,
            cancelled_cheque_url: formData.cancelledCheque,
        };
    },

    /**
     * Step 4: Working Schedule
     */
    mapWorkingSchedule(formData) {
        return {
            working_days: formData.workingDays,
            organization_type: formData.organizationType,
            organization_type_other: formData.organizationTypeOther,
            proof_of_legal_identity: formData.proofOfLegalIdentity,
            proof_of_legal_identity_other: formData.proofOfLegalIdentityOther,
            legal_identity_document_id: formData.legalIdentityDocumentId,
            legal_identity_document_url: formData.legalIdentityDocument,
            shift_timings: formData.shiftTimings.map((shift) => ({
                shift_from: shift.from,
                shift_to: shift.to,
            })),
        };
    },

    /**
     * Step 5: Compliance Documents
     */
    mapComplianceDocuments(formData) {
        return {
            compliance_documents: formData.complianceDocuments.map((doc) => ({
                document_type: doc.type,
                document_type_other: doc.typeOther,
                document_id: doc.id,
                file_url: doc.file,
            })),
        };
    },

    /**
     * Step 6: Policy Documents
     */
    mapPolicyDocuments(formData) {
        return {
            impartiality_document_url: formData.impartialityDocument,
            terms_conditions_document_url: formData.termsConditionsDocument,
            code_of_ethics_document_url: formData.codeOfEthicsDocument,
            testing_charges_policy_document_url: formData.testingChargesPolicyDocument,
        };
    },

    /**
     * Step 7: Infrastructure
     */
    mapInfrastructure(formData) {
        return {
            adequacy_sanctioned_load: formData.adequacySanctionedLoad,
            availability_uninterrupted_power: formData.availabilityUninterruptedPower,
            stability_of_supply: formData.stabilityOfSupply,
            water_source: formData.waterSource,
        };
    },

    /**
     * Step 8: Accreditation
     */
    mapAccreditation(formData) {
        return {
            accreditation_documents: formData.accreditationDocuments.map((doc) => ({
                certification_type: doc.certificationType,
                certification_type_other: doc.certificationTypeOther,
                certificate_no: doc.certificateNo,
                certificate_file_url: doc.certificateFile,
                scope_file_url: doc.scopeFile,
            })),
        };
    },

    /**
     * Step 8: Other Details
     */
    mapOtherDetails(formData) {
        return {
            other_details: formData.otherLabDetails,
            other_details_document_url: formData.otherDetailsDocument,
            layout_lab_premises_url: formData.layoutLabPremises,
            organization_chart_url: formData.organizationChart,
            gps_latitude: formData.gpsLatitude,
            gps_longitude: formData.gpsLongitude,
        };
    },

    /**
     * Step 9: Quality Manual
     */
    mapQualityManual(formData) {
        return {
            title: formData.qualityManualTitle,
            issue_number: formData.qualityManualIssueNumber,
            issue_date: formData.qualityManualIssueDate,
            amendments: formData.qualityManualAmendments,
            document_url: formData.qualityManualDocument,
            sops: formData.sopList.map((sop) => ({
                title: sop.title,
                number: sop.number,
                issue_number: sop.issueNumber,
                issue_date: sop.issueDate,
                amendments: sop.amendments,
            })),
        };
    },

    /**
     * Step 10: Quality Formats & Procedures
     */
    mapQualityFormats(formData) {
        return {
            quality_formats: formData.qualityFormats.map((format) => ({
                title: format.title,
                number: format.number,
                issue_number: format.issueNumber,
                issue_date: format.issueDate,
                amendments: format.amendments,
            })),
            quality_procedures: formData.qualityProcedures.map((proc) => ({
                title: proc.title,
                number: proc.number,
                file_url: proc.file,
                issue_number: proc.issueNumber,
                issue_date: proc.issueDate,
                amendments: proc.amendments,
            })),
        };
    },
};

/**
 * Save organization data for a specific step
 */
export async function saveOrganizationStep(organizationId, step, formData) {
    switch (step) {
        case 1:
            return await organizationService.updateLaboratoryDetails(
                organizationId,
                organizationMapper.mapLaboratoryDetails(formData)
            );

        case 2:
            return await organizationService.updateRegisteredOffice(
                organizationId,
                organizationMapper.mapRegisteredOffice(formData)
            );

        case 3:
            // Step 3 has two parts
            await organizationService.updateParentOrganization(
                organizationId,
                organizationMapper.mapParentOrganization(formData)
            );
            return await organizationService.updateBankDetails(
                organizationId,
                organizationMapper.mapBankDetails(formData)
            );

        case 4:
            return await organizationService.updateWorkingSchedule(
                organizationId,
                organizationMapper.mapWorkingSchedule(formData)
            );

        case 5:
            return await organizationService.updateComplianceDocuments(
                organizationId,
                organizationMapper.mapComplianceDocuments(formData)
            );

        case 6:
            return await organizationService.updatePolicyDocuments(
                organizationId,
                organizationMapper.mapPolicyDocuments(formData)
            );

        case 7:
            return await organizationService.updateInfrastructure(
                organizationId,
                organizationMapper.mapInfrastructure(formData)
            );

        case 8:
            // Step 8 has two parts
            await organizationService.updateAccreditation(
                organizationId,
                organizationMapper.mapAccreditation(formData)
            );
            return await organizationService.updateOtherDetails(
                organizationId,
                organizationMapper.mapOtherDetails(formData)
            );

        case 9:
            return await organizationService.updateQualityManual(
                organizationId,
                organizationMapper.mapQualityManual(formData)
            );

        case 10:
            return await organizationService.updateQualityFormats(
                organizationId,
                organizationMapper.mapQualityFormats(formData)
            );

        case 11:
            // Step 11 is the checklist/review step - no data to save
            // Just return success to allow navigation
            return { success: true };

        default:
            throw new Error(`Invalid step: ${step}`);
    }
}

/**
 * Upload file and return URL
 */
export async function uploadFile(file, fieldName) {
    if (!file) return null;

    try {
        // Determine file type
        if (fieldName === 'labLogo') {
            return await fileService.uploadLogo(file);
        } else {
            // Determine document type based on field name
            let docType = 'general';
            if (fieldName.includes('compliance')) docType = 'compliance';
            else if (fieldName.includes('policy')) docType = 'policy';
            else if (fieldName.includes('accreditation')) docType = 'accreditation';
            else if (fieldName.includes('quality')) docType = 'quality';

            return await fileService.uploadDocument(file, docType);
        }
    } catch (error) {
        console.error('File upload failed:', error);
        throw error;
    }
}

export default {
    organizationMapper,
    saveOrganizationStep,
    uploadFile,
};
