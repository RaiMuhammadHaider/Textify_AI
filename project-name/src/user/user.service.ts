import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RegisterUserDto } from 'src/dto/allDTO';
import { User, UserDocument } from 'src/schema/userSchema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async registerUser(registerUserDto: RegisterUserDto): Promise<UserDocument> {
    return await this.userModel.create(registerUserDto);
  }

  async findUserByEmail(email: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findUserByLoginOtp(otp: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({ otp }).exec();
  }

  async findUserByResetOtp(resetOtp: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({ resetOtp }).exec();
  }

  async findUserById(id: string): Promise<UserDocument | null> {
    return await this.userModel.findById(id).exec();
  }

  async updateUser(
    id: string,
    data: Partial<User>,
  ): Promise<UserDocument | null> {
    return await this.userModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async updateUserByEmail(
    email: string,
    data: Partial<User>,
  ): Promise<UserDocument | null> {
    return await this.userModel
      .findOneAndUpdate({ email: email.toLowerCase() }, data, { new: true })
      .exec();
  }

  async findAllUsers(): Promise<UserDocument[]> {
    return await this.userModel.find().select('-password').exec();
  }

  async getUserProfile(userId: string): Promise<UserDocument | null> {
    return await this.userModel
      .findById(userId)
      .select('-password')
      .exec();
  }
}
