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
  isBill = false;
  isBillEdit = false;
  material = {};

  constructor(material) {
    if (!material) material = {};
    this.material = {...material};
    this.name = material.item_name || '';
    this.line_no = material.line_no || '';
    this.item_code = material.item_code || '';
    this.item_spec = material.item_spec || '';
    this.unit = material.unit || '';
    this.price = material.price || 0;
    this.quantity = material.quantity || 0;
    this.id = material.item_id;
    this.deliver_time = material.deliver_time || null;
    this.submitType = material.item_id ? this.SubmitType.MODIFY : this.SubmitType.ADD;
    this.isBill = material.isBill;
    this.isBillEdit = material.isBillEdit;
  }

  SubmitType = {
    ADD: 0,
    MODIFY: 1,
  };

  @computed get validated() {
    let lineNoValidated = true;
    if (this.isBill && (this.line_no || this.line_no === 0)) {
      lineNoValidated = !(this.line_no < 10 || (this.line_no % 10 !== 0));
    }
    switch (this.submitType) {
      case this.SubmitType.ADD: return !!this.name && lineNoValidated;
      case this.SubmitType.MODIFY: return !!this.id && lineNoValidated;
      default: return false;
    }
  }

  @action setKey = (key, val) => this[key] = val;
  @action submit = async (onCloseCallback, onAddCallBack) => {
    if (this.submitting || !this.validated) return;
    this.submitting = true;
    try {
      const price = parseFloat(`${this.price}`);
      const resp = await BaseSvc.addItem(this.name, this.item_code, this.item_spec, this.unit, price);
      runInAction('after submit add', () => {
        if (resp.code === '0') {
          Toast.show('创建成功');
          if (this.isBill) {
            resp.data.line_no = this.line_no;
            resp.data.quantity = this.quantity;
            resp.data.deliver_time = this.deliver_time;
          }
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
    if (this.isBillEdit) {
      const material = {
        ...this.material,
        amount: this.quantity * this.price,
        quantity: this.quantity,
        line_no: this.line_no,
        deliver_time: this.deliver_time,
      };
      onUpdateCallback && onUpdateCallback(material);
      onCloseCallback && onCloseCallback();
      return;
    }
    if (this.submitting || !this.validated) return;
    this.submitting = true;
    try {
      const price = parseFloat(`${this.price}`);
      const resp = await BaseSvc.updateItem(this.id, this.name, this.item_code, this.item_spec, this.unit, price);
      runInAction('after submit add', () => {
        if (resp.code === '0') {
          // onUpdateCallback && onUpdateCallback(resp.data);
        }
        else Toast.show(resp.msg || '抱歉，操作失败，请稍后重试');
      });
      if (!this.id || resp.code !== '0') return;
      const data = await BaseSvc.getItem(this.id);
      runInAction('after load item detail', () => {
        if (data.code === '0' && onUpdateCallback) {
          if (this.isBill) {
            data.data[0].line_no = this.line_no;
            data.data[0].quantity = this.quantity;
            data.data[0].deliver_time = this.deliver_time;
            data.data[0].amount = this.quantity * this.price;
          }
          onUpdateCallback(data.data[0]);
          Toast.show('修改成功');
        } else Toast.show(data.msg || '抱歉，发生未知错误，请稍后重试');
      })
    } catch (e) {
      console.log(e, 'submit material item');
      Toast.show('抱歉，发生未知错误，请稍后重试');
    }
    onCloseCallback && onCloseCallback();
    this.submitting = false;
  };
}

const checkedRepeated = (line_no, items) => {
  const isRepeated = items.findIndex(i => i.line_no === line_no) > -1;
  if (isRepeated) {
    line_no += 10;
    return checkedRepeated(line_no, items);
  }
  return line_no;
}

@observer
class AddMaterial extends React.Component {
  constructor(props) {
    super(props);
    const {material, isBill, isBillEdit, items} = props;
    material.isBill = !!isBill;
    material.isBillEdit = !!isBillEdit;
    if (!material.line_no && items && items.length >= 0) {
      material.line_no = checkedRepeated((items.length + 1) * 10, items);
    }
    this.store = new AddMaterialState(material);
  }
  render() {
    const {material, onDel, isBill, isBillEdit} = this.props;
    const submitTxt = (material && material.item_id) ? '修改' : '创建';
    const submitAction = (material && material.item_id) ? this.store.update : this.store.submit;
    return (
      <form onSubmit={submitAction}>
        <TextField floatingLabelText="物料名称"
                   disabled={!!isBillEdit}
                   value={this.store.name} style={{marginRight: 20}}
                   onChange={(e, value) => this.store.setKey('name', value)}/>
        <TextField floatingLabelText="自定义物料编码"
                   disabled={!!isBillEdit}
                   value={this.store.item_code} style={{marginRight: 20}}
                   onChange={(e, value) => this.store.setKey('item_code', value)}/>
        {isBill && (
          <TextField floatingLabelText="行号（10的整数倍数）"
                     type="number"
                     disabled={!!isBillEdit}
                     value={this.store.line_no} style={{marginRight: 20}}
                     onChange={(e, value) => this.store.setKey('line_no', value ? parseInt(value, 10) : '')}/>
        )}
        <TextField floatingLabelText="规格备注"
                   disabled={!!isBillEdit}
                   value={this.store.item_spec} style={{marginRight: 20}}
                   onChange={(e, value) => this.store.setKey('item_spec', value)}/>
        {isBill && (
          <TextField floatingLabelText="数量"
                     type="number"
                     value={this.store.quantity} style={{marginRight: 20}}
                     onChange={(e, value) => this.store.setKey('quantity', value ? parseFloat(value) : '')}/>
        )}
        <TextField floatingLabelText="单位"
                   disabled={!!isBillEdit}
                   value={this.store.unit} style={{marginRight: 20}}
                   onChange={(e, value) => this.store.setKey('unit', value)}/>
        <TextField floatingLabelText="单价"
                   type="number"
                   value={this.store.price} style={{marginRight: 20}}
                   onChange={(e, value) => this.store.setKey('price', value ? parseFloat(value).toFixed(2) : '')}/>
        {isBill && (
          <TextField floatingLabelText="金额" readOnly style={{marginRight: 20}}
                     disabled={!!isBillEdit}
                     value={((this.store.quantity || 0) * (this.store.price || 0)).toFixed(2)}/>
        )}
        {(isBill && this.store.deliver_time) && (
          <DatePicker floatingLabelText="交期/收货" style={{marginRight: 20}}
                      defaultDate={new Date(this.store.deliver_time)}
                      onChange={(e, value) => this.store.setKey('deliver_time', new Date(value).getTime()) }/>
        )}
        {(isBill && !this.store.deliver_time) && (
          <DatePicker floatingLabelText="交期/收货" style={{marginRight: 20}}
                      onChange={(e, value) => this.store.setKey('deliver_time', new Date(value).getTime()) }/>
        )}
        <div style={{textAlign: 'right'}}>
          <RaisedButton style={{ marginTop: 20 }} label={this.store.submitting ? null : submitTxt}
                        icon={this.store.submitting ? <CircularProgress size={28}/> : null}
                        primary={!!this.store.validated} disabled={!this.store.validated}
                        onClick={submitAction.bind(null, this.props.onclose, this.props.onAdd, this.props.onUpdate)} />
          {onDel && material && (
            <RaisedButton style={{ marginTop: 20, marginLeft: 20 }} label="删除" primary
                          onClick={() => {onDel(material); this.props.onclose();}} />)}
          <RaisedButton style={{ marginTop: 20, marginLeft: 20 }} label="取消"
                        primary={false} onClick={this.props.onclose} />
        </div>
      </form>
    )
  }
}

export default AddMaterial;