import React from 'react';
import {observer, inject} from 'mobx-react';
import {observable, computed, action, runInAction} from 'mobx';
import {List, ListItem} from 'material-ui/List';
import Divider from 'material-ui/Divider';
import Subheader from 'material-ui/Subheader';
import {grey400, darkBlack} from 'material-ui/styles/colors';
import IconButton from 'material-ui/IconButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import BaseSvc from '../../../services/baseData';
import MerchantSvc from '../../../services/merchant';
import MemberIcon from 'material-ui/svg-icons/action/face';
import MerchantIcon from 'material-ui/svg-icons/maps/local-mall';
import DepartmentIcon from 'material-ui/svg-icons/action/perm-contact-calendar';
import ChildDepartmentIcon from 'material-ui/svg-icons/social/people';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import CircularProgress from 'material-ui/CircularProgress';
import FlatButton from 'material-ui/FlatButton';
import {ToastStore as Toast} from "../../../components/Toast";
import {BizDialog, ComfirmDialog} from "../../../components/Dialog";
import DialogForm from "../../items/DialogForm";
import MemberStore from "../../stores/merchantMember";
import UserDetail, {SetDepartment} from '../../items/UserDetail';
import SetMerchant from '../../items/SetMerchant';
import Storage from '../../../utils/storage';

class MaterialsStore {
  @observable DS = [];
  @observable loading = false;
  @observable landed = false;

  @action load = async () => {
    if (this.loading) return;
    this.loading = true;
    try {

    } catch (e) {
      console.log(e, 'load materials');
      Toast.show('抱歉，发生未知错误，请刷新页面稍后重试');
    }
    this.loading = false;
    if (!this.landed) this.landed = true;
  }
}

@observer
export default class Material extends React.Component {
  render() {
    return (
      <div className="search-content">

      </div>
    );
  }
}
