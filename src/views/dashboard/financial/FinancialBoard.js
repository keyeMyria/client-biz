import React from 'react';
import {observable, computed, action, runInAction} from 'mobx';
import {observer} from 'mobx-react';
import {Input, Spin, List, Button, Modal,} from 'antd';
import FinancialSvc from '../../../services/financialBill';
import {ToastStore as Toast} from "../../../components/Toast";
import FinancialDetail, {FinancialDrawer} from "./Detail";

const confirm = Modal.confirm;

export default class FinancialBoard extends React.PureComponent {
  render() {
    return (
      <div className="bill-board financial-board">
        <DataList />
        <Search />
        <FinancialDetail />
      </div>
    );
  }
}

class FinBillStore {
  @observable DS = [];
  @observable recordCount = 0;
  @observable pageNo = 1;
  @observable hasMore = false;
  @observable landed = false;
  @observable loading = false;
  @observable searchedBillNo = '';
  @observable searchResult = null;
  @observable searching = false;
  pageSize = 20;

  @computed get searchValidated() {
    return !!this.searchedBillNo;
  }

  @action setSearchNo = val => this.searchedBillNo = val;

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
      const resp = await FinancialSvc.getBillList(pageNo, this.pageSize);
      runInAction('after load list', () => {
        if (resp.code === '0' && resp.data) {
          this.DS = this.pageNo > 1 ? [...this.DS, ...resp.data.list] : resp.data.list;
          this.recordCount = (resp.data.pagination && resp.data.pagination.record_count) || 0;
          this.hasMore = !!resp.data.pagination.has_next_page;
          if (this.hasMore) this.pageNo++;
        } else Toast.show(resp.msg || '抱歉，发生未知错误，请检查网络连接稍后重试');
      })
    } catch (e) {
      console.log(e, 'load financial list');
      Toast.show('抱歉，发生未知错误，请检查网络连接稍后重试');
    }
    this.loading = false;
    if (!this.landed) this.landed = true;
  };

  @action loadMore = () => {
    console.log('load more');
    if (!this.hasMore) return;
    this.load();
  };

  @action updateItemConfirm = item => {
    this.DS.forEach(data => {
      if (data.bill_no === item.bill_no) data.confirm_status = item.confirm_status;
    });
    this.DS = [...this.DS];
  };

  @action onAbort = (item) => {
    const abort = this.abort;
    confirm({
      title: '是否废除该结算单?',
      onOk() {
        abort(item);
      },
      onCancel() {},
    });
  };

  @action abort = async (item) => {
    if (this.aborting) return;
    if (!!item.confirm_status || !!item.relative_confirm_status) {
      Toast.show('只有在双方都取消确认的情况下才能作废');
      return;
    }
    this.aborting = true;
    try {
      const resp = await FinancialSvc.abort(item.bill_no);
      runInAction('after abort', () => {
        if (resp.code === '0') {
          Toast.show('当前单据已废弃');
          this.DS = this.DS.filter(ds => item.bill_no !== ds.bill_no);
        } else Toast.show(resp.msg || '抱歉，作废失败，请刷新页面后重试');
      });
    } catch (e) {
      console.log(e, 'aborting fin bill');
      Toast.show('抱歉，发生未知错误，请刷新页面后重新尝试');
    }
    this.aborting = false;
  };

  @action search = async () => {
    if (this.searching || !this.searchValidated) return;
    this.searching = true;
    try {
      const resp = await FinancialSvc.getBill(this.searchedBillNo);
      runInAction('after search', () => {
        if (resp.code === '0') {
          this.searchResult = resp.data.head;
          if (this.searchResult) {
            Toast.show('搜索完成');
          } else {
            Toast.show('没有搜索到相关结果');
          }
        } else Toast.show(resp.msg || '抱歉，搜索失败，请刷新页面后重新尝试');
      });
    } catch (e) {
      console.log(e, 'search fin bill');
      Toast.show('抱歉，发生未知错误，请刷新页面后重新尝试');
    }
    this.searching = false;
  }
}

export const FinStore = new FinBillStore();

@observer
class DataList extends React.Component {
  store = FinStore;
  componentWillMount() {
    this.store.load();
  }
  render() {
    const {DS, landed, hasMore, onAbort, loadMore, loading} = this.store;
    const LoadMore = hasMore ? (
      <div style={{ textAlign: 'center', margin: '20px 0', height: 32, lineHeight: '32px' }}>
        {loading && <Spin />}
        {!loading && <Button onClick={loadMore}>加载更多</Button>}
      </div>
    ) : null;
    return (
      <div>
        <List
          style={{width: 400, marginRight: 20, backgroundColor: '#FFF'}}
          header={<div style={{paddingLeft: 20}}>财务结算单</div>}
          dataSource={DS}
          loading={!landed}
          loadMore={LoadMore}
          renderItem={item => (
            <List.Item
              actions={[
                <p onTouchTap={FinancialDrawer.onOpen.bind(null, item)}>查看</p>,
                <p onTouchTap={onAbort.bind(null, item)}>作废</p>,
              ]}
            >
              <List.Item.Meta
                style={{paddingLeft: 20}}
                title={<p>单据号: {item.bill_no}</p>}
                description={`${item.mer_name} ${item.create_time}`}
              />
            </List.Item>
          )}
        />
      </div>
    );
  }
}

@observer
class Search extends React.Component {
  store = FinStore;
  render() {
    const item = this.store.searchResult;
    return(
      <form className="board-search" style={{maxWidth: 400}} onSubmit={this.onSubmit}>
        <h3 style={{marginTop: 10}}>查找结算单</h3>
        <Input.Search
          placeholder='请输入查找的单据号'
          style={{width: 300, margin: '20px 0'}}
          onChange={e => this.store.setSearchNo(e.target.value)}
          onSearch={() => this.store.search()}
        />
        <br/>
        {this.store.searching && <Spin size="large" style={{display: 'block', margin: '20px auto'}}/>}
        {this.store.searchResult && (
          <List.Item
            style={{backgroundColor: '#FFF'}}
            actions={[
              <p onTouchTap={FinancialDrawer.onOpen.bind(null, item)}>查看</p>,
              <p onTouchTap={this.store.onAbort.bind(null, item)}>作废</p>,
            ]}
          >
            <List.Item.Meta
              style={{paddingLeft: 20}}
              title={<p>单据号: {item.bill_no}</p>}
              description={`${item.mer_name} ${item.create_time}`}
            />
          </List.Item>
        )}
      </form>
    );
  }
  onSubmit = (e) => {
    e.preventDefault();
    this.store.search();
  }
}
