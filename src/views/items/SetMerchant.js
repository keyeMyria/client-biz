import React from 'react';
import {observable, computed, action, runInAction} from 'mobx';
import { observer } from 'mobx-react';
import RaisedButton from 'material-ui/RaisedButton';
import {BizDialog} from "../../components/Dialog";
import Partners from '../stores/partners';
import Checkbox from 'material-ui/Checkbox';
import CircularProgress from 'material-ui/CircularProgress';
import MerchantSvc from '../../services/merchant';
import {ToastStore as Toast} from "../../components/Toast";

class SetMerchantStore {
  @observable userMerchants = [];
  @observable selected = [];
  @observable submitting = false;
  user = null;

  constructor(user) {
    this.user = user;
    this.load();
  }

  @computed get arrForAdd() {
    const addArr = [];
    this.selected.forEach(item => {
      const isAdd = this.userMerchants.findIndex(m => m.partner_id === item.partner_id) === -1;
      if (isAdd) addArr.push(item.partner_id);
    });
    return addArr;
  }

  @computed get arrForDel() {
    const delArr = [];
    this.userMerchants.forEach(item => {
      const isDel = this.selected.findIndex(m => m.partner_id === item.partner_id) === -1;
      if (isDel) delArr.push(item.partner_id);
    });
    return delArr;
  }

  @computed get canSubmit() {
    return !!this.arrForAdd.length || !!this.arrForDel.length;
  }

  @action load = async () => {
    console.log(this.user);
    if (!this.user) return;
    try {
      const resp = await MerchantSvc.getMerchantListByUserInCharge(this.user.user_id);
      runInAction('after load', () => {
        if (resp.code === '0') {
          this.userMerchants = [...resp.data];
          this.selected = [...resp.data];
        } else Toast.show(resp.msg || '对不起，获取用户负责商户失败，请刷新后重试');
      });
    } catch (e) {
      console.log(e, 'load user merchant in charge');
      Toast.show('抱歉，发生未知错误，请检查网络连接稍后重试');
    }
  };

  @action updateUserMerchant = (merchant, checked) => {
    if (checked) {
      this.selected.push(merchant);
    } else {
      this.selected = this.selected.filter(m => m.partner_id !== merchant.partner_id);
    }
  };

  @action submit = async () => {
    if (this.submitting || !this.canSubmit) return;
    this.submitting = true;
    const needAdd = this.arrForAdd.length > 0;
    const needDel = this.arrForDel.length > 0;
    let addErr = '';
    let delErr = '';
    try {
      const {user_id} = this.user;
      if (needAdd) {
        const addId = this.arrForAdd.length === 1 ? this.arrForAdd[0] : this.arrForAdd.join(',');
        const addResp = await MerchantSvc.addUserInChargeMerchant(user_id, addId);
        runInAction('after add', () => {
          if (addResp.code === '0') {

          } else addErr = addResp.msg || '添加用户负责商户失败';
        });
      }
      if (needDel) {
        const delId = this.arrForDel.length === 1 ? this.arrForDel[0] : this.arrForDel.join(',');
        const delResp = await MerchantSvc.delUserInChargeMerchant(user_id, delId);
        runInAction('after add', () => {
          if (delResp.code === '0') {

          } else delErr = delResp.msg || '删除用户负责商户失败';
        });
      }
    } catch (e) {
      console.log(e, 'submit user merchant in charge');
      Toast.show('抱歉，发生未知错误，请检查网络连接稍后重试');
    }
    if (addErr || delErr) Toast.show(`${addErr}${addErr && delErr ? (', ' + delErr) : delErr}`);
    if (!addErr && !delErr) Toast.show('设置成功');
    BizDialog.onClose();
    this.submitting = false;
  }
}

@observer
export default class SetMerchant extends React.Component {
  partners = Partners;
  store = new SetMerchantStore(this.props.user);
  componentWillMount() {
    if (!this.partners.DS.length) this.partners.load();
  }
  render() {
    // const {user} = this.props;
    console.log(this.partners.DS.length, this.partners.landed);
    return (
      <form>
        {!this.partners.landed && this.partners.loading && (
          <CircularProgress size={28} style={{display: 'block', margin: '20px auto'}}/>
        )}
        <div style={{padding: '10px 0'}}>
          {this.partners.DS.map((merchant, key) => (
            <Checkbox label={`商户：${merchant.inner_partner_name} (id: ${merchant.partner_id})`}
                      key={key}
                      checked={this.store.selected.findIndex(m => m.partner_id === merchant.partner_id) > -1}
                      onCheck={(event, checked) => this.store.updateUserMerchant(merchant, checked)}/>
          ))}
          {this.partners.landed && !this.partners.DS.length && <p>暂无可配置的合作商户</p>}
        </div>
        <div style={{textAlign: 'right'}}>
          <RaisedButton style={{ marginTop: 20, marginLeft: 20 }} label='确认修改'
                        disabled={!this.store.canSubmit}
                        primary={this.store.canSubmit} onClick={this.store.submit} />
          <RaisedButton style={{ marginTop: 20, marginLeft: 20 }} label='关闭'
                        primary={false} onClick={BizDialog.onClose} />
        </div>
      </form>
    )
  }
}
