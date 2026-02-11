import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  doctorId: string = '';

  @IsString()
  department: string = '';

  @IsDateString()
  slotStart: string = '';

  @IsDateString()
  slotEnd: string = '';

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  chiefComplaint?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateAppointmentDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class AddClinicalNotesDto {
  @IsString()
  @IsOptional()
  diagnosis?: string;

  @IsOptional()
  vitals?: any;

  @IsOptional()
  prescription?: any;

  @IsString()
  @IsOptional()
  notes?: string;
}

// Alias for backward compatibility
export { UpdateAppointmentDto as UpdateAppointmentStatusDto };