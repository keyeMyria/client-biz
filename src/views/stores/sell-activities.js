import {observable, computed, action, runInAction} from 'mobx';
import homeSvc from "../../services/home";
import Storage from '../../utils/storage';
import {ToastStore as Toast} from "../../components/Toast";

class SellActivitiesStore {
  @observable messageList = [];
  @observable recordCount = 0;
  @observable pageNo = 1;
  @observable hasMore = false;
  @computed get unReadListDS() {
    return this.messageList.filter(item => !item.read_flag);
  }
  @computed get isReadListDS() {
    return this.messageList.filter(item => item.read_flag === 1);
  }
  @computed get inChargeListDS() {
    return this.messageList.filter(item => !item.read_flag && (item.user_id === Storage.getValue('user').id));
  }
  @computed get participantListDS() {
    return this.messageList.filter(item => !item.read_flag && (item.user_id !== Storage.getValue('user').id));
  }
  pageSize = 20;

  @action load = async () => {
    if (this.loading) return;
    this.loading = true;
    const pageNo = this.pageNo > 1 ? this.pageNo : null;
    try {
      const resp = await homeSvc.getSellList(pageNo, this.pageSize);
      runInAction('after load list', () => {
        if (resp.code === '0' && resp.data.list) {
          this.messageList = this.pageNo > 1 ? [...this.messageList, ...resp.data.list] : resp.data.list;
          this.recordCount = (resp.data.pagination && resp.data.pagination.record_count) || 0;
          this.hasMore = this.messageList.length < this.recordCount;
          if (this.hasMore) this.pageNo++;
        }
      })
    } catch (e) {
      console.log(e, 'load sale activities');
      Toast.show('抱歉，发生未知错误，请稍后重试');
    }
    this.loading = false;
  }
}
const activitiesStore = new SellActivitiesStore();
export default activitiesStore;
