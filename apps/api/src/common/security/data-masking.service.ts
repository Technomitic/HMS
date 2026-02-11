import { Injectable } from '@nestjs/common';

/**
 * Masks sensitive data for logging and non-privileged display
 */
@Injectable()
export class DataMaskingService {
  maskEmail(email: string): string {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (!domain) return '***';
    const masked = local.slice(0, 2) + '***';
    return `${masked}@${domain}`;
  }

  maskPhone(phone: string): string {
    if (!phone || phone.length < 6) return '***';
    return phone.slice(0, 3) + '****' + phone.slice(-3);
  }

  maskSSN(ssn: string): string {
    if (!ssn || ssn.length < 4) return '***';
    return '***-**-' + ssn.slice(-4);
  }

  maskName(name: string): string {
    if (!name || name.length < 2) return '***';
    return name.charAt(0) + '*'.repeat(name.length - 1);
  }

  maskCreditCard(number: string): string {
    if (!number || number.length < 4) return '***';
    return '**** **** **** ' + number.slice(-4);
  }

  maskMRN(mrn: string): string {
    if (!mrn || mrn.length < 4) return '***';
    return mrn.slice(0, 3) + '***' + mrn.slice(-3);
  }

  /**
   * Mask entire patient object for non-privileged contexts
   */
  maskPatientForLogs(patient: any): any {
    if (!patient) return null;
    return {
      id: patient.id,
      mrn: this.maskMRN(patient.mrn),
      user: patient.user
        ? {
            id: patient.user.id,
            email: this.maskEmail(patient.user.email),
            firstName: this.maskName(patient.user.firstName),
            lastName: this.maskName(patient.user.lastName),
            phone: patient.user.phone
              ? this.maskPhone(patient.user.phone)
              : null,
          }
        : undefined,
    };
  }
}