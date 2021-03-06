import {observable, action, runInAction, computed} from 'mobx';
import {ToastStore as Toast} from "../../components/Toast";
import BaseSvc from "../../services/baseData";
import {BizDialog} from "../../components/Dialog";
import PartnerSvc from '../../services/partner';

class Partners {
  @observable DS = [];
  @observable loading = false;
  @observable hasMore = false;
  @observable pageNo = 1;
  @observable recordCount = 0;
  @observable landed = false;
  pageSize = 20;

  @action load = async () => {
    if (this.loading) return;
    if (this.landed && !this.hasMore) return;
    this.loading = true;
    const pageNo = this.pageNo > 1 ? this.pageNo : null;
    try {
      const resp = await BaseSvc.getPartnerList(pageNo, this.pageSize);
      runInAction('after load ds', () => {
        if (resp.code === '0' && resp.data.list) {
          this.DS = this.pageNo > 1 ? [...this.DS, ...resp.data.list] : [...resp.data.list];
          this.recordCount = (resp.data.pagination && resp.data.pagination.record_count) || 0;
          this.hasMore = resp.data.pagination.has_next_page !== 0;
          if (this.hasMore) this.pageNo++;
        } else Toast.show(resp.msg);
      })
    } catch (e) {
      console.log(e, 'load partner list');
      Toast.show('抱歉，发生未知错误，请检查网络连接稍后重试');
    }
    this.loading = false;
    if (!this.landed) this.landed = true;
  };

  @action refresh = () => {
    this.pageNo = 1;
    this.load();
  };

  @action onDelete = async (partner) => {
    if (!partner && partner.partner_id) return;
    if (this.deleting) return;
    this.deleting = true;
    try {
      const resp = await BaseSvc.delPartner(partner.partner_id);
      runInAction('after del', () => {
        if (resp.code === '0') {
          BizDialog.onClose();
          this.DS = [...this.DS.filter(ds => ds.partner_id !== partner.partner_id)];
          Toast.show('解除成功');
        } else Toast.show(resp.msg || '抱歉，解除失败，请稍后重试');
      })
    } catch (e) {
      console.log(e, 'del partner');
      Toast.show('抱歉，发生未知错误，请检查网络连接稍后重试');
    }
  }
}

export default new Partners();

class InChargeMerchantStore {
  @observable rawDS = [];
  @observable loading = false;
  @observable landed = false;

  @computed get DS() {
    return this.rawDS;
  }

  @action load = async () => {
    if (this.loading) return;
    this.loading = true;
    try {
      const resp = await PartnerSvc.getInChargeMerchants();
      runInAction('after load invite', () => {
        if (resp.code === '0' && resp.data) {
          this.rawDS = resp.data;
        } else Toast.show(resp.msg);
      })
    } catch (e) {
      console.log(e, 'load partner invite');
      Toast.show('抱歉，发生未知错误，请检查网络连接稍后重试');
    }
    this.loading = false;
    if (!this.landed) this.landed = true;
  };
}

export const InChargeStore = new InChargeMerchantStore();