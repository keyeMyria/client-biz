import React from 'react';
import {observable, computed, action, runInAction} from 'mobx';
import {observer} from 'mobx-react';
import {MessageItem} from "../../components/ListItem";
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import Divider from 'material-ui/Divider';
import CircularProgress from 'material-ui/CircularProgress';
import TextField from 'material-ui/TextField';
import SearchIcon from 'material-ui/svg-icons/action/search';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import BillSvc from '../../services/bill';
import {ToastStore as Toast} from "../../components/Toast";

const SearchType = {
  BILL_NO: 0,
  PARTNER_NAME: 1,
  ITEM_NAME: 2,
};

class SearchState {
  @observable searchKey = '';
  @observable searchResult = [];
  @observable searching = false;
  @observable recordCount = 0;
  @observable pageNo = 1;
  @observable hasMore = false;
  @observable searchType = SearchType.BILL_NO;
  pageSize = 20;

  @computed get searchValidated() {
    return !!this.searchKey; // && this.searchKey.length === 18
  }

  @action search = (isProcurement) => {
    if (this.searchType === SearchType.BILL_NO) {
      this.searchByBill(isProcurement);
      return;
    }
    this.searchByKey(isProcurement);
  }
  @action searchByBill = async (isProcurement) => {
    if (this.searching || !this.searchValidated) return;
    this.searching = true;
    const pageNo = this.pageNo > 1 ? this.pageNo : null;
    const bill_type = isProcurement ? 1 : 2;
    try {
      const resp = await BillSvc.searchBill(this.searchKey, bill_type, pageNo, this.pageSize);
      runInAction('after search', () => {
        if (resp.code === '0') {
          this.searchResult = this.pageNo > 1 ? [...this.searchResult, ...resp.data.list] : [...resp.data.list];
          this.recordCount = (resp.data.pagination && resp.data.pagination.record_count) || 0;
          this.hasMore = this.searchResult.length < this.recordCount;
          if (this.hasMore)  this.pageNo++;
          if (this.searchResult.length) {
            Toast.show('搜索成功');
          } else {
            Toast.show('没有找到相关单据');
          }
        } else {
          this.searchResult = [];
          Toast.show(resp.msg || '没有找到相关单据');
        }
      });
    } catch (e) {
      console.log(e, 'search bill by no');
      Toast.show('没有找到相关单据');
    }
    this.searching = false;
  }
  @action searchByKey = async (isProcurement) => {
    if (this.searching || !this.searchValidated) return;
    this.searching = true;
    try {
      const resp = await BillSvc.searchBillByKey(this.searchKey, this.searchType);
      runInAction('after search', () => {
        if (resp.code === '0' && resp.data) {
          this.searchResult = resp.data.filter(item => {
            if (isProcurement) {
              return (item.bill_type === 3 || item.bill_type === 2 || item.bill_type === 4);
            }
            return (item.bill_type === 5 || item.bill_type === 1 || item.bill_type === 4);
          });
          if (this.searchResult.length) {
            Toast.show('搜索成功');
          } else {
            Toast.show('没有找到相关单据');
          }
          this.recordCount = resp.data.length;
          this.hasMore = false;
        } else {
          this.searchResult = [];
          Toast.show(resp.msg || '没有找到相关单据');
        }
      });
    } catch (e) {
      console.log(e, 'search bill by key');
      Toast.show('没有找到相关单据');
    }
    this.searching = false;
  }
}

@observer
export default class SearchBill extends React.Component {
  store = new SearchState();

  render() {
    const {isProcurement, title} = this.props;
    let text = '关键字';
    if (this.store.searchType === SearchType.BILL_NO) text = '单据号';
    return (
      <div className="board-search">
        <h3>{title}</h3>
        <SelectField
          floatingLabelText="查找类型"
          value={this.store.searchType}
          style={{marginRight: 20}}
          onChange={(event, index, val) => this.store.searchType = val}
        >
          <MenuItem value={SearchType.BILL_NO} primaryText='单据号' />
          <MenuItem value={SearchType.PARTNER_NAME} primaryText='物料名称' />
          <MenuItem value={SearchType.ITEM_NAME} primaryText='合作伙伴名称' />
        </SelectField><br/>
        <TextField
          floatingLabelText={`请输入查找的${text}`}
          value={this.store.searchKey}
          type={this.store.searchType === SearchType.BILL_NO ? 'number' : 'text'}
          onChange={e => this.store.searchKey = e.target.value}
          style={{marginRight: 20}}
        />
        <RaisedButton label="查找" primary={this.store.searchValidated} icon={<SearchIcon />}
                      disabled={!this.store.searchValidated} onTouchTap={this.store.search.bind(null, isProcurement)}/>
        <br/>
        {this.store.searchType !== SearchType.BILL_NO && <p style={{color: '#999', fontSize: 12}}>(最多返回100条查询结果)</p>}
        {this.store.searching && <CircularProgress size={28} style={{display: 'block', margin: '20px auto'}}/>}
        <div style={{width: 400, marginTop: 20}}>
          {!!this.store.searchResult.length && this.store.searchResult.map((item, key) => (
            <MessageItem message={item} isProcurement={isProcurement} key={key}/>
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
