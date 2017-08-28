import React from 'react';
import { observable, computed, action, runInAction} from 'mobx';
import { observer } from 'mobx-react';
import {MessageItem} from "../../components/ListItem";
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import Divider from 'material-ui/Divider';
import CircularProgress from 'material-ui/CircularProgress';
import TextField from 'material-ui/TextField';
import SearchIcon from 'material-ui/svg-icons/action/search';
import BillSvc from '../../services/bill';
import {ToastStore as Toast} from "../../components/Toast";

class SearchState {
  @observable searchedBillNo = '';
  @observable searchResult = [];
  @observable searching = false;
  @observable recordCount = 0;
  @observable pageNo = 1;
  @observable hasMore = false;
  pageSize = 20;

  @computed get searchValidated() {
    return !!this.searchedBillNo && this.searchedBillNo.length === 18;
  }

  @action setSearchNo = val => this.searchedBillNo = val;

  @action search = async (isProcurement) => {
    if (this.searching || !this.searchValidated) return;
    this.searching = true;
    const pageNo = this.pageNo > 1 ? this.pageNo : null;
    const bill_type = isProcurement ? 1 : 2;
    try {
      const resp = await BillSvc.searchBill(this.searchedBillNo, bill_type, pageNo, this.pageSize);
      runInAction('after search', () => {
        if (resp.code === '0') {
          Toast.show('搜索成功');
          this.searchResult = this.pageNo > 1 ? [...this.searchResult, ...resp.data.list] : [...resp.data.list];
          this.recordCount = (resp.data.pagination && resp.data.pagination.record_count) || 0;
          this.hasMore = this.searchResult.length < this.recordCount;
          if (this.hasMore)  this.pageNo++;
        } else {
          this.searchResult = [];
          Toast.show(resp.msg || '没有找到该单据');
        }
      });
    } catch (e) {
      console.log(e, 'search fin bill');
      Toast.show('没有找到该单据');
    }
    this.searching = false;
  }
}

@observer
export default class SearchBill extends React.PureComponent {
  store = new SearchState();

  render() {
    const {isProcurement, title} = this.props;
    return (
      <div className="board-search">
        <h3>{title}</h3>
        <TextField
          floatingLabelText="请输入查找的单据号(18位)"
          value={this.store.searchedBillNo}
          type="number"
          onChange={e => this.store.setSearchNo(e.target.value)}
          style={{marginRight: 20}}
        />
        <RaisedButton label="查找" primary={this.store.searchValidated} icon={<SearchIcon />}
                      disabled={!this.store.searchValidated} onTouchTap={this.store.search.bind(null, isProcurement)}/>
        <br/>
        {this.store.searching && <CircularProgress size={28} style={{display: 'block', margin: '20px auto'}}/>}
        <div style={{width: 400, marginTop: 20}}>
          {!!this.store.searchResult.length && this.store.searchResult.map(item => (
            <MessageItem message={item} isProcurement={isProcurement}/>
          ))}
          {this.store.hasMore && (
            <div style={{backgroundColor: '#FFF', textAlign: 'right'}}>
              <Divider inset={true} />
              <FlatButton label="加载更多" primary={true} onTouchTap={this.store.search.bind(null, isProcurement)}/>
            </div>
          )}
        </div>
      </div>
    );
  }
}
