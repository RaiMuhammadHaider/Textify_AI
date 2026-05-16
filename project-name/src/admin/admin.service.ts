import { Injectable } from '@nestjs/common';

@Injectable() // ya inject krni ha ta k is ko controller ma use kr saken
export class AdminService {
  getAdmin(): any {
    return { name: 'Admin', Role: 'Any role' };
  }
  filltheFormForAdmin(): any {}
}
