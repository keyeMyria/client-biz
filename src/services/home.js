import axios from './index';

const getPurchaseList = async (page_no, page_size) => {
  const resp = await axios.post('/home_gateway/batch_query_purchase_biz', {page_no, page_size});
  return resp.data;
};

const getSellList = async (page_no, page_size) => {
  const resp = await axios.post('/home_gateway/batch_query_sell_biz', {page_no, page_size});
  return resp.data;
};


export default {
  getPurchaseList,
  getSellList,
}