import {observable, computed, action, runInAction} from 'mobx';
import baseSvc from "../../services/baseData";
import Storage from '../../utils/storage';
import {ToastStore as Toast} from "../../components/Toast";

class MaterialStore {
  @observable itemList = [];
  @observable recordCount = 0;
  @observable pageNo = 1;
  @observable hasMore = false;
  @observable openMemberListDialog = false;
  @observable openAddItemDialog = false;
  @observable editingMaterial = {};
  @observable loading = false;
  @observable landed = false;
  pageSize = 20;

  @action load = async () => {
    if (this.loading) return;
    this.loading = true;
    const pageNo = this.pageNo > 1 ? this.pageNo : null;
    try {
      const resp = await baseSvc.getItemList(pageNo, this.pageSize);
      runInAction('after load list', () => {
        if (resp.code === '0' && resp.data.list) {
          this.itemList = this.pageNo > 1 ? [...this.itemList, ...resp.data.list] : resp.data.list;
          this.recordCount = (resp.data.pagination && resp.data.pagination.record_count) || 0;
          this.hasMore = !!resp.data.pagination.has_next_page;
          if (this.hasMore) this.pageNo++;
        }
      })
    } catch (e) {
      console.log(e, 'load material list');
      Toast.show('抱歉，发生未知错误，请稍后重试');
    }
    this.loading = false;
    this.landed = true;
  }
  @action refresh = () => {
    this.pageNo = 1;
    this.hasMore = false;
    this.load();
  }
  @action closeMemberDialog = () => this.openMemberListDialog = false;
  @action openMemberDialog = () => this.openMemberListDialog = true;
  @action openItemDialog = item => {
    if (item) this.editingMaterial = item;
    this.openAddItemDialog = true;
  };
  @action closeItemDialog = () => {
    this.editingMaterial = {};
    this.openAddItemDialog = false;
  };
  @action addMaterialItem = item => this.itemList = [...this.itemList, item];
  @action deleteMaterialItem = async (item) => {
    try {
      const resp = await baseSvc.delItem(item.item_id);
      runInAction('after delete success', () => {
        if (resp.code === '0') {
          this.itemList = this.itemList.filter(raw => raw.item_id !== item.item_id);
          Toast.show('删除成功');
        } else {
          Toast.show(resp.msg || '抱歉，删除失败，请稍后重试');
        }
      });
    } catch (e) {
      console.log(e, 'delete item');
      Toast.show('抱歉，删除失败，请检查网络稍后重试');
    }

  }
  @action updateMaterialItem = item => {
    const index = this.itemList.findIndex(r => r.item_id === item.item_id);
    if (index > -1) {
      this.itemList[index] = item;
    }
  };
}
const materialStore = new MaterialStore();
export default materialStore;
