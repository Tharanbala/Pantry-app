'use client';
import Image from "next/image";
import { useState , useEffect, useRef } from "react";
import {Camera} from "react-camera-pro";
import { collection, addDoc, query, onSnapshot, deleteDoc, doc, updateDoc, getDoc} from "firebase/firestore"; 
import {db} from './firebase'
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Modal from '@mui/material/Modal';
import UpdateIcon from '@mui/icons-material/Update';
import DeleteIcon from '@mui/icons-material/Delete';
import Stack from '@mui/material/Stack';
import SearchIcon from '@mui/icons-material/Search';
import CameraIcon from '@mui/icons-material/Camera';
import Autocomplete from '@mui/material/Autocomplete';

import * as dotenv from 'dotenv';
import { OpenAI } from 'openai';

export default function Home() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({name: '', quantity: ''})
  const [updateValue, setValue] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const camera = useRef(null);
  const [image, setImage] = useState(null);

  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  dotenv.config()

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };

  // add item to pantry
  const addItem = async (e) => {
    console.log(items)
    e.preventDefault()
    if (newItem.name != "" && newItem.quantity != "") {
      await addDoc(collection(db, "pantry"), {
        name: newItem.name.trim(),
        quantity: newItem.quantity
      });
      setNewItem({name: '', quantity: ''});
    }
    else {
      alert("Enter the item and quantity")
    }
  }
 
  // read item from pantry
  useEffect (() => {
    if (typeof window !== 'undefined') {
      const t = query(collection(db, 'pantry'))
      const read = onSnapshot(t, (querySnapshot) => {
        let itemsArr = []

        querySnapshot.forEach((doc) => {
          itemsArr.push({...doc.data(), id: doc.id})
        })
        setItems(itemsArr)

        // calculate total from itemsArr
        const calculate = () => {
          const totalQuantity = itemsArr.reduce((sum, item) => sum + parseFloat(item.quantity),0)
          setTotal(totalQuantity) 
        }
        calculate();
        return () => read();
      })
    }
  }, []);

  // delete item in pantry
  const deleteItem = async (id) => {
    await deleteDoc(doc(db, 'pantry', id));
  }

  // update item in pantry
  const updateItem = async () => { 
    if (selectedItem && updateValue) {
      const itemDoc = doc(db, 'pantry', selectedItem.id);
      await updateDoc(itemDoc, {
        quantity: updateValue
      });
      setValue('');
      setSelectedItem(null);
    }
  }

  return (
    <main className="bg-[url('/pantry.png')] bg-cover flex flex-col min-h-screen items-center justify-between sm:p-24 p-4">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm bg-slate-600">
        <h1 className="text-white text-4xl p-4 text-center">Pantry Management App</h1>
        <div className="p-4 rounded-lg">
          <div className="flex justify-center mb-4">
            <div className="w-2/4 h-2/4 pt-5 mb-3">
              <Camera ref={camera} aspectRatio={16 / 9}/>
              <div className="mt-5 flex items-center justify-center">
                <CameraIcon style={{cursor:"pointer"}} onClick={() => {setImage(camera.current.takePhoto()); response()}}/>
              </div>                
              {image && <img src={image} alt='Pantry tracker' style={{ maxWidth: '100%', maxHeight: '100%' }} />}
            </div>
          </div>
          <form className="grid grid-cols-6 items-center text-black">
            <input value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} className="col-span-3 p-3 border" type='text' placeholder="Item"/> 
            <input value={newItem.quantity} onChange={(e) => setNewItem({...newItem, quantity: e.target.value})} className="col-span-2 p-3 broder mx-3" type="text" placeholder="Quantity"/>
            <button onClick={addItem} className="text-white bg-slate-950 p-3 hover:bg-slate-700" type="submit">Add</button>
          </form>
          <div className="mt-4 flex justify-center">
            <Button variant="outlined" startIcon={<SearchIcon />} onClick={handleOpen}>
              Search and Update
            </Button>
            <Modal
              open={open}
              onClose={handleClose}
              aria-labelledby="modal-modal-title"
              aria-describedby="modal-modal-description"
            >
              <Box sx={style}>
                <Stack width="100%" direction={'row'} spacing={1}>
                <Autocomplete
                    disablePortal
                    id="combo-box-demo"
                    options={items}
                    getOptionLabel={(item) => item.name}
                    onChange={(event, newValue) => {
                      setSelectedItem(newValue);
                    }}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {...params} label="Items" />}
                />
                  <TextField value={updateValue} onChange={(e) => setValue(e.target.value)} id="outlined-basic" label="Quantity" variant="outlined" />
                  <Button onClick={() => {updateItem(); handleClose()}} variant="outlined">Update</Button>
                </Stack>
              </Box>
            </Modal>
          </div>
          <ul>
            {items.map((item, id) => (
              <li key={item.id} className="my-4 w-full flex justify-between items-center bg-slate-400">
                <div className="p-4 w-full flex justify-between">
                  <span className="capitalize">{item.name}</span>
                  <span>{item.quantity} pc</span>
                </div>
                {/* <UpdateIcon style={{cursor:"pointer"}} onClick={handleOpen}/> */}
                <DeleteIcon sx={{cursor:"pointer", mx: '1rem'}} onClick={() => deleteItem(item.id)}/>
                {/* <button onClick={() => deleteItem(item.id)} className="text-white l-8 border-l-2 border-slate-800 hover:bg-slate-900 w-16">X</button> */}
              </li>
            ))}
          </ul>
          {items.length < 1 ? ("") : (
            <div className="text-white p-3 flex justify-between">
              <span>Total Quantity</span>
              <span>{total} pc</span>
            </div>
          )}
        </div>
      </div> 
    </main>
  );
}
