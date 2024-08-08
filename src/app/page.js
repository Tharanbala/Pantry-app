'use client';
import { useState , useEffect, useRef } from "react";
import {Camera} from "react-camera-pro";
import { collection, addDoc, query, onSnapshot, deleteDoc, doc, updateDoc, getDoc} from "firebase/firestore"; 
import {db} from './firebase'
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CameraIcon from '@mui/icons-material/Camera';
import { Box, Button, Modal, Stack, Autocomplete, TextField  } from '@mui/material';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

import OpenAI from "openai";

export default function Home() {
  let date = new Date();
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({name: '', quantity: '', date: dayjs(date)})
  const [updateValue, setValue] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const camera = useRef(null);
  const [image, setImage] = useState(null);

  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('AddItem')

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

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
    e.preventDefault()
    if (newItem.name != "" && newItem.quantity != "") {
      const options = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
      const upDate = new Date(newItem.date.toString())
      const formatedDate = upDate.toLocaleDateString('en-US', options)
      const [weekday, month, day, year] = formatedDate.split(' ');
      await addDoc(collection(db, "pantry"), {
        name: newItem.name.trim(),
        quantity: newItem.quantity,
        date: `${weekday} ${day} ${month} ${year}`
      });
      setNewItem({name: '', quantity: '', date: dayjs(Date())});
      alert("Item added to the Inventory")
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

  // openAI api
  const result = async () => {
    const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY , dangerouslyAllowBrowser: true});
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text", text: "Return a JSON structure of the list of array. Only return the JSON structure, nothing else. Do not return ````json in the result."
            }
          ]
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Give me a array of objects with the name and quantity of the product in the image. The structure should be like this: [{quantity: '5', name: 'Apple', id: 'SWpLU8ebh4IHEKwb8VRR'}, {name: 'Banana', quantity: '5', id: 'VvPUId8wp7Lu67AwN7mX'}]. Use unique ids for each product." },
            {
              type: "image_url",
              image_url: {
                "url": image
              },
            },
          ],
        },
      ],
      "max_tokens": 1000
    });

    const parsedItems = JSON.parse(response.choices[0].message.content);
    for (const item of parsedItems) {
      await addDoc(collection(db, "pantry"), {
        name: item.name.trim(),
        quantity: item.quantity
      });
    }
    console.log(parsedItems);
  }

  return (
    <div className="flex min-h-screen">
      {/* SideBar */}
      <div className="bg-slate-500 text-nord-white min-h-screen p-4">
        <div className="mb-8"> 
          <h1 className="text-3xl font-bold">Pantry Management</h1>
        </div>
        <div>
          <div className={`p-2 mb-2 cursor-pointer ${activeSection === 'AddItem' ? 'text-purple-700 font-bold' : 'text-nord-white'}`}
            onClick={() => setActiveSection('AddItem')}>
            Add Item
          </div>
          <div className={`p-2 mb-2 cursor-pointer ${activeSection === 'Inventory' ? 'text-purple-700 font-bold' : 'text-nord-white'}`}
            onClick={() => setActiveSection('Inventory')}>
            Inventory
          </div>
          <div className={`p-2 disabled`}>
            Recipe Suggestion
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 p-8 bg-nord-gray">
        {activeSection === "AddItem" && (
          <div>
            <div className="flex flex-col items-center">
              <h2 className="text-2xl m-12">Add New Item</h2>
              <form className="grid grid-cols-6 items-center text-black">
                <input value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} className="col-span-3 p-3 border" type='text' placeholder="Item"/> 
                <input value={newItem.quantity} onChange={(e) => setNewItem({...newItem, quantity: e.target.value})} className="col-span-2 p-3 border mx-3" type="text" placeholder="Quantity"/>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DemoContainer components={['DatePicker']}>
                    <DatePicker label="Expiry Date" value={newItem.date} onChange={(newValue) => setNewItem({...newItem, date: newValue})}/>
                  </DemoContainer>
                </LocalizationProvider>
              </form>
              <button onClick={addItem} className="text-white bg-purple-950 p-3 hover:bg-purple-700 w-1/6 mt-5" type="submit">Add</button>
            </div>
            <div className="flex justify-center mb-4">
              <div className="w-1/3 pt-5 mb-3">
                <Camera ref={camera} aspectRatio={16 / 9}/>
                <div className="mt-5 flex items-center justify-center">
                  <CameraIcon style={{cursor:"pointer"}} onClick={() => {setImage(camera.current.takePhoto()); result()}}/>
                </div>                
                {image && <img src={image} alt='Pantry tracker' style={{ maxWidth: '100%', maxHeight: '100%' }} />}
              </div>
            </div>
          </div>
        )}
        {activeSection === "Inventory" && (
          <div>
            <h2 className="text-2xl m-12">Inventory</h2>
            <div className="flex justify-center mb-4">
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
                    <span>Quantity - {item.quantity} pc</span>
                    <span>Expiry Date - {item.date}</span>
                  </div>
                  <DeleteIcon sx={{cursor:"pointer", mx: '1rem'}} onClick={() => deleteItem(item.id)}/>
                </li>
              ))}
            </ul>
            {items.length < 1 ? ("") : (
              <div className="p-3 flex justify-between">
                <span>Total Quantity</span>
                <span>{total} pc</span>
              </div>
            )}           
          </div>
        )}
      </div>
    </div>
    // <main className="flex flex-col min-h-screen items-center justify-between sm:p-24 p-4">
    //   <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm bg-slate-600">
    //     <h1 className="text-white text-4xl p-4 text-center">Pantry Management App</h1>
    //     <div className="p-4 rounded-lg">
    //       <div className="flex justify-center mb-4">
    //         <div className="w-2/4 h-2/4 pt-5 mb-3">
    //           <Camera ref={camera} aspectRatio={16 / 9}/>
    //           <div className="mt-5 flex items-center justify-center">
    //             <CameraIcon style={{cursor:"pointer"}} onClick={() => {setImage(camera.current.takePhoto()); result()}}/>
    //           </div>                
    //           {image && <img src={image} alt='Pantry tracker' style={{ maxWidth: '100%', maxHeight: '100%' }} />}
    //         </div>
    //       </div>
    //       <form className="grid grid-cols-6 items-center text-black">
    //         <input value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} className="col-span-3 p-3 border" type='text' placeholder="Item"/> 
    //         <input value={newItem.quantity} onChange={(e) => setNewItem({...newItem, quantity: e.target.value})} className="col-span-2 p-3 broder mx-3" type="text" placeholder="Quantity"/>
    //         <button onClick={addItem} className="text-white bg-slate-950 p-3 hover:bg-slate-700" type="submit">Add</button>
    //       </form>
    //       <div className="mt-4 flex justify-center">
    //         <Button variant="outlined" startIcon={<SearchIcon />} onClick={handleOpen}>
    //           Search and Update
    //         </Button>
    //         <Modal
    //           open={open}
    //           onClose={handleClose}
    //           aria-labelledby="modal-modal-title"
    //           aria-describedby="modal-modal-description"
    //         >
    //           <Box sx={style}>
    //             <Stack width="100%" direction={'row'} spacing={1}>
    //             <Autocomplete
    //                 disablePortal
    //                 id="combo-box-demo"
    //                 options={items}
    //                 getOptionLabel={(item) => item.name}
    //                 onChange={(event, newValue) => {
    //                   setSelectedItem(newValue);
    //                 }}
    //                 sx={{ width: 300 }}
    //                 renderInput={(params) => <TextField {...params} label="Items" />}
    //             />
    //               <TextField value={updateValue} onChange={(e) => setValue(e.target.value)} id="outlined-basic" label="Quantity" variant="outlined" />
    //               <Button onClick={() => {updateItem(); handleClose()}} variant="outlined">Update</Button>
    //             </Stack>
    //           </Box>
    //         </Modal>
    //       </div>
          // <ul>
          //   {items.map((item, id) => (
          //     <li key={item.id} className="my-4 w-full flex justify-between items-center bg-slate-400">
          //       <div className="p-4 w-full flex justify-between">
          //         <span className="capitalize">{item.name}</span>
          //         <span>{item.quantity} pc</span>
          //       </div>
          //       <DeleteIcon sx={{cursor:"pointer", mx: '1rem'}} onClick={() => deleteItem(item.id)}/>
          //     </li>
          //   ))}
          // </ul>
          // {items.length < 1 ? ("") : (
          //   <div className="text-white p-3 flex justify-between">
          //     <span>Total Quantity</span>
          //     <span>{total} pc</span>
          //   </div>
          // )}
    //     </div>
    //   </div> 
    // </main>
  );
}
