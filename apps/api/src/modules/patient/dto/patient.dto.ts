import { IsString, IsOptional, IsArray, IsBoolean, IsDateString } from 'class-validator';

export class CreatePatientDto {
  @IsDateString()
  dateOfBirth: string = '';

  @IsString()
  gender: 'MALE' | 'FEMALE' | 'OTHER' = 'MALE';

  @IsString()
  @IsOptional()
  bloodGroup?: string;

  @IsArray()
  @IsOptional()
  allergies?: string[];

  @IsString()
  @IsOptional()
  emergencyName?: string;

  @IsString()
  @IsOptional()
  emergencyPhone?: string;

  @IsString()
  @IsOptional()
  emergencyRelation?: string;

  @IsString()
  @IsOptional()
  addressLine1?: string;

  @IsString()
  @IsOptional()
  addressLine2?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  zipCode?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  insuranceProvider?: string;

  @IsString()
  @IsOptional()
  insurancePolicyNo?: string;

  @IsBoolean()
  @IsOptional()
  consentSigned?: boolean;
}

export class UpdatePatientDto {
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  gender?: 'MALE' | 'FEMALE' | 'OTHER';

  @IsString()
  @IsOptional()
  bloodGroup?: string;

  @IsArray()
  @IsOptional()
  allergies?: string[];

  @IsString()
  @IsOptional()
  emergencyName?: string;

  @IsString()
  @IsOptional()
  emergencyPhone?: string;

  @IsString()
  @IsOptional()
  emergencyRelation?: string;

  @IsString()
  @IsOptional()
  addressLine1?: string;

  @IsString()
  @IsOptional()
  addressLine2?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  zipCode?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  insuranceProvider?: string;

  @IsString()
  @IsOptional()
  insurancePolicyNo?: string;

  @IsBoolean()
  @IsOptional()
  consentSigned?: boolean;
}