import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? 'mtm-access-dev-secret',
    });
  }

  async validate(payload: { sub: string; name: string; role: 'MANAGER' | 'STAFF' }) {
    return {
      id: payload.sub,
      name: payload.name,
      role: payload.role,
    };
  }
}
