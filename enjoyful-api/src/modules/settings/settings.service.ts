import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting, SettingDocument } from './schemas/setting.schema';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Setting.name) private settingModel: Model<SettingDocument>,
  ) {}

  async getSettings(): Promise<Setting> {
    let setting = await this.settingModel.findOne({ key: 'global_config' });
    if (!setting) {
      setting = await this.settingModel.create({
        key: 'global_config',
        showProductPrices: true,
      });
    }
    return setting;
  }

  async updateSettings(updateData: { showProductPrices?: boolean }): Promise<Setting> {
    const setting = await this.settingModel.findOneAndUpdate(
      { key: 'global_config' },
      { $set: updateData },
      { new: true, upsert: true },
    );
    return setting;
  }
}
