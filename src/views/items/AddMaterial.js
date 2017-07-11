import React from 'react';
import { observer } from 'mobx-react';
import {observable, computed, action, runInAction} from 'mobx';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import DatePicker from 'material-ui/DatePicker';
import CircularProgress from 'material-ui/CircularProgress';
import {ToastStore as Toast} from "../../components/Toast";
import BaseSvc from '../../services/baseData';

class AddMaterialState {
  @observable name = '';
  @observable line_no = '';
  @observable item_code = '';
  @observable item_spec = '';
  @observable unit = '';
  @observable price = 0;
  @observable quantity = 0;
  @observable deliver_time = null;
  @observable submitting = false;
  @observable submitType = this.SubmitType.ADD;
  id = null;

  constructor(material = {}) {
    this.name = material.name || '';
    this.line_no = material.line_no || '';
    this.item_code = material.item_code || '';
    this.item_spec = material.item_spec || '';
    this.unit = material.unit || '';
    this.price = material.price || 0;
    this.quantity = material.quantity || 0;
    this.id = material.id;
    this.submitType = material.id ? this.SubmitType.MODIFY : this.SubmitType.ADD;
  }

  SubmitType = {
    ADD: 0,
    MODIFY: 1,
  };

  @computed get validated() {
    switch (this.submitType) {
      case this.SubmitType.ADD: return !!this.name;
      case this.SubmitType.MODIFY: return !!this.id;
      default: return false;
    }
  }

  @action setKey = (key, val) => this[key] = val;
  @action submit = async (onCloseCallback, onAddCallBack) => {
    if (this.submitting || !this.validated) return;
    this.submitting = true;
    try {
      const price = parseFloat(this.price);
      const resp = await BaseSvc.addItem(this.name, this.line_no, this.item_code, this.item_spec, this.unit, price,
        this.quantity, this.deliver_time);
      runInAction('after submit add', () => {
        if (resp.code === '0') {
          Toast.show('创建成功');
          onAddCallBack && onAddCallBack(resp.data);
        }
        else Toast.show(resp.msg || '抱歉，操作失败，请稍后重试');
      })
    } catch (e) {
      console.log(e, 'submit material item');
      Toast.show('抱歉，发生未知错误，请稍后重试');
    }
    onCloseCallback && onCloseCallback();
    this.submitting = false;
  };

  @action update = async (onCloseCallback, onAddCallback, onUpdateCallback) => {
    if (this.submitting || !this.validated) return;
    this.submitting = true;
    try {
      const resp = await BaseSvc.updateItem(this.id, this.name, this.line_no, this.item_code, this.item_spec, this.unit, this.price,
        this.quantity);
      runInAction('after submit add', () => {
        if (resp.code === '0') {
          Toast.show('修改成功');
          // onUpdateCallback && onUpdateCallback(resp.data);
        }
        else Toast.show(resp.msg || '抱歉，操作失败，请稍后重试');
      })
    } catch (e) {
      console.log(e, 'submit material item');
      Toast.show('抱歉，发生未知错误，请稍后重试');
    }
    onCloseCallback && onCloseCallback();
    this.submitting = false;
  };
}

@observer
class AddPartner extends React.PureComponent {
  store = new AddMaterialState(this.props.material);
  render() {
    const {material} = this.props;
    const submitTxt = material.id ? '修改' : '创建';
    const submitAction = material.id ? this.store.update : this.store.submit;
    return (
      <form onSubmit={submitAction}>
        <TextField floatingLabelText="物料名称"
                   value={this.store.name} style={{marginRight: 20}}
                   onChange={(e, value) => this.store.setKey('name', value)}/>
        <TextField floatingLabelText="自定义物料编码"
                   value={this.store.item_code} style={{marginRight: 20}}
                   onChange={(e, value) => this.store.setKey('item_code', value)}/>
        <TextField floatingLabelText="行号"
                   value={this.store.line_no} style={{marginRight: 20}}
                   onChange={(e, value) => this.store.setKey('line_no', value)}/>
        {/*{detail.type === DetailContentType.SALE_ORDER && <TextField floatingLabelText="客户物料号"*/}
                                                                    {/*className="edit-field"*/}
                                                                    {/*defaultValue={this.focusGoodData && this.focusGoodData.client_goods_no}*/}
                                                                    {/*onChange={(e, value) => this.focusGoodData.client_goods_no = parseInt(value, 10)}/>}*/}
        <TextField floatingLabelText="规格备注"
                   value={this.store.item_spec} style={{marginRight: 20}}
                   onChange={(e, value) => this.store.setKey('item_spec', value)}/>
        <TextField floatingLabelText="数量"
                   type="number"
                   value={this.store.quantity} style={{marginRight: 20}}
                   onChange={(e, value) => this.store.setKey('quantity', parseInt(value, 10))}/>
        <TextField floatingLabelText="单位"
                   value={this.store.unit} style={{marginRight: 20}}
                   onChange={(e, value) => this.store.setKey('unit', value)}/>
        <TextField floatingLabelText="单价"
                   type="number"
                   value={this.store.price} style={{marginRight: 20}}
                   onChange={(e, value) => this.store.setKey('price', parseFloat(value).toFixed(2))}/>
        <TextField floatingLabelText="金额" readOnly style={{marginRight: 20}}
                   value={((this.store.quantity || 0) * (this.store.price || 0)).toFixed(2)}/>
        <DatePicker floatingLabelText="交期/收货" style={{marginRight: 20}}
                    defaultDate={this.store.deliver_time ? new Date(this.store.deliver_time) : new Date()}
                    onChange={(e, value) => this.store.setKey('deliver_time', new Date(value).getTime()) }/>
        <div style={{textAlign: 'right'}}>
          <RaisedButton style={{ marginTop: 20 }} label={this.store.submitting ? null : submitTxt}
                        icon={this.store.submitting ? <CircularProgress size={28}/> : null}
                        primary={!!this.store.validated} disabled={!this.store.validated}
                        onClick={submitAction.bind(null, this.props.onclose, this.props.onAdd, this.props.onUpdate)} />
          <RaisedButton style={{ marginTop: 20, marginLeft: 20 }} label="取消"
                        primary={false} onClick={this.props.onclose} />
        </div>
      </form>
    )
  }
}

export default AddPartner;