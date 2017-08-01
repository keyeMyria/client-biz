import React from 'react';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import {BizDialog} from '../../components/Dialog';
import {ToastStore as Toast} from '../../components/Toast';
import BaseSvc from '../../services/baseData';

export default class ProfileDialog extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
     name: props.user.name || '暂无用户名',
    }
  }
  submit = async () => {
    if (this.submitting || !this.state.name) return;
    const {user, update} = this.props;
    this.submitting = true;
    try {
      const resp = await BaseSvc.updateUser(user.id, this.state.name, user.dept_id);
      if (resp.code === '0') {
        user.name = this.state.name;
        update && update(user);
        Toast.show('修改成功');
        this.forceUpdate();
      } else Toast.show(resp.msg || '抱歉，设置失败，请刷新页面重新尝试');
    } catch (e) {
      console.log(e, 'set user name');
      Toast.show('抱歉，发生未知错误，请刷新页面稍后重试');
    }
    this.submitting = false;
  };
  render() {
    const {user} = this.props;
    const {name} = this.state;
    return (
      <div>
        <TextField
          hintText="暂无"
          floatingLabelText="账户及ID"
          value={`账户: ${user.account} / ID: ${user.id}`}
          floatingLabelFixed={true}
          readOnly
          style={{marginRight: 20}}
        />
        <TextField
          hintText="暂无"
          floatingLabelText="用户名"
          value={name}
          floatingLabelFixed={true}
          onChange={e => this.setState({name: e.target.value})}
          style={{marginRight: 20}}
        />
        <TextField
          hintText="暂无"
          floatingLabelText="当前商户名及ID"
          value={user.mer_id ? `商户名：${user.mer_name} / ID：${user.mer_id}` : ''}
          floatingLabelFixed={true}
          readOnly
          style={{marginRight: 20}}
        />
        <TextField
          hintText="暂无"
          floatingLabelText="当前部门及ID"
          value={user.dept_id ? `部门：${user.dept_name} / ID：${user.dept_id}` : ''}
          floatingLabelFixed={true}
          readOnly
          style={{marginRight: 20}}
        />
        <div style={{textAlign: 'right'}}>
          <RaisedButton style={{ marginTop: 20, marginLeft: 20 }} label='修改用户名'
                        disabled={!name || name === user.name}
                        primary={name !== user.name} onClick={this.submit} />
          <RaisedButton style={{ marginTop: 20, marginLeft: 20 }} label='关闭'
                        primary={false} onClick={BizDialog.onClose} />
        </div>
      </div>
    )
  }
}
