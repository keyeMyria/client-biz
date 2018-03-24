import React from 'react';
import { observable, action, runInAction} from 'mobx';
import { observer } from 'mobx-react';
import {Button} from 'antd';
import {LoadMoreButton} from '../../../components/Buttons';
import {MessageItem} from "../../../components/ListItem";
import BillSvc from '../../../services/bill';
import {ToastStore as Toast} from "../../../components/Toast";
import SearchBill from '../../items/SearchBill';
import AddBill from "../../items/AddBill";
import {BizDialog} from '../../../components/Dialog';

class SaleBillStore {
  @observable DS = [];
  @observable recordCount = 0;
  @observable pageNo = 1;
  @observable hasMore = false;
  @observable landed = false;
  @observable loading = false;
  pageSize = 20;

  @action refresh = () => {
    this.hasMore = false;
    this.pageNo = 1;
    this.load();
  };

  @action load = async () => {
    if (this.loading) return;
    this.loading = true;
    const pageNo = this.pageNo > 1 ? this.pageNo : null;
    try {
      const resp = await BillSvc.getBillList(2, pageNo, this.pageSize);
      runInAction('after load list', () => {
        if (resp.code === '0' && resp.data.list) {
          this.DS = this.pageNo > 1 ? [...this.DS, ...resp.data.list] : resp.data.list;
          this.recordCount = (resp.data.pagination && resp.data.pagination.record_count) || 0;
          this.hasMore = !!resp.data.pagination.has_next_page;
          if (this.hasMore) this.pageNo++;
        } else Toast.show(resp.msg || '抱歉，发生未知错误，请检查网络连接稍后重试');
      })
    } catch (e) {
      console.log(e, 'load procurement bill');
      Toast.show('抱歉，发生未知错误，请检查网络连接稍后重试');
    }
    this.loading = false;
    if (!this.landed) this.landed = true;
  }
}

const SaleStore = new SaleBillStore();

@observer
export default class SaleBoard extends React.Component {
  store = SaleStore;
  state = {openFollowActions: false};
  async componentWillMount() {
    this.store.load();
  }

  addBill = () => BizDialog.onOpen('创建单据', <AddBill />);

  render() {
    return (
      <div className="bill-board sale-bill">
        <div style={{marginRight: 50}}>
          <div className="bill-header">
            <div className="header-left">
              <p className="title">销售业务</p>
            </div>
          </div>
          <div className="bill-list">
            {!this.store.DS.length && <p className="none-data">暂无业务单据</p>}
            {this.store.DS.map((data, index) => (
              <MessageItem message={data} key={index}/>
            ))}
            <div style={{width: '100%', textAlign: 'right', paddingTop: 20}}>
              <Button onTouchTap={this.addBill} style={{backgroundColor: 'transparent', marginRight: 10}}>创建</Button>
              {this.store.hasMore && <LoadMoreButton onTouchTap={this.store.load}/>}
            </div>
          </div>
        </div>
        <SearchBill title="查找销售单据"/>
      </div>
    );
  }
}
