import { Module } from '@nestjs/common';
import { MedixGateway } from './medix.gateway';
import { GatewaySessionManager } from './gateway-session.manager';

@Module({
  providers: [MedixGateway, GatewaySessionManager],
  exports: [MedixGateway],
})
export class GatewayModule {}