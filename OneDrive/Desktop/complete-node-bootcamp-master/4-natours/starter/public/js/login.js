import axios from 'axios';
import {
  showAlert
} from './alerts'
export const login = async (email, password) => {
  console.log(email, password);
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password
      }
    });
    if (res.data.status === 'success') {
      showAlert('success', 'logged in succcessfully !');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout',

    });
    if ((res.data.status === 'success')) {
      showAlert('success', 'logged out succcessfully !');
      location.reload(true);
    } // loaction.reload refreshes the page not from cache memory
  } catch (err) {
    console.log(err.response)
    showAlert('ERROR', 'error logging out ,try again!')
  }
}