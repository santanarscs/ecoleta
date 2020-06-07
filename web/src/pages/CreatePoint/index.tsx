import React, { useEffect, useState, useCallback, FormEvent, ChangeEvent} from 'react'

import { Map, TileLayer,Marker } from 'react-leaflet'
import { FiArrowLeft } from 'react-icons/fi'
import { Link, useHistory } from 'react-router-dom'
import api from '../../services/api'
import Dropzone from '../../components/Dropzone'
import axios from 'axios'

import logo from '../../assets/logo.svg'
import './styles.css'
import { LeafletMouseEvent } from 'leaflet'

interface Item {
  id: number,
  title: string,
  image_url: string
}
interface IBGEUfResponse {
  sigla: string
}
interface IBGECityResponse {
  nome: string
}

const CreatePoint: React.FC = () => {
  const history = useHistory()
  const [items, setItems] = useState<Item[]>([])
  const [initialPosition, setInitialPosition] = useState<[number, number]>([0,0])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: ''
  })
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [ufs, setUfs] = useState<string[]>([])
  
  const [selectedUf, setSelectedUf] = useState('0')
  const [cities, setCities] = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState('0')
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0,0])
  const [ selectedFile, setSelectedFile ] = useState<File>()
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(position => {
      const {latitude, longitude} = position.coords
      setInitialPosition([
        latitude,
        longitude
      ])
    })
  }, [])

  useEffect(() => {
    api.get('/items').then(response => setItems(response.data))
  }, [])

  useEffect(() => {
    axios.get<IBGEUfResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados/')
      .then(response => {
        const ufInitials = response.data.map(uf => uf.sigla)
        setUfs(ufInitials);
      })
  }, [])

  useEffect(() => {
    if(selectedUf === '0' ){
      return
    }
    axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
      .then(response => {
        const cityNames = response.data.map(city => city.nome)
        setCities(cityNames);
      })
  }, [selectedUf])

  function handleSelectUf(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedUf(event.target.value)
  }
  function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedCity(event.target.value)
  }
  function handleMapClick(event: LeafletMouseEvent) {
    setSelectedPosition([
      event.latlng.lat,
      event.latlng.lng
    ])
  }

  function hanldeInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target

    setFormData({
      ...formData,
      [name]: value
    })
  }

  function handleSelectItem(id: number) {
    const alreadySelected = selectedItems.findIndex(item => item === id)
    if(alreadySelected >= 0)  {
      const filteredItems = selectedItems.filter(item => item !== id)
      setSelectedItems(filteredItems)
    }else {
      setSelectedItems([...selectedItems, id])
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { name, email, whatsapp } = formData;
    const uf = selectedUf;
    const city = selectedCity;
    const [latitude, longitude] = selectedPosition;
    const items = selectedItems
    const data = new FormData();

      data.append('name',name);
      data.append('email',email);
      data.append('whatsapp',whatsapp);
      data.append('uf',uf);
      data.append('city',city);
      data.append('latitude',String(latitude));
      data.append('longitude',String(longitude));
      data.append('items',items.join(','));
      
      if(selectedFile) {
        data.append('image', selectedFile)
      }

    await api.post('/points', data)
    alert('ponto de coleta criado')
    history.push('/')
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="ecoleta"/>
        <Link to="/">
        <FiArrowLeft />
          Voltar para Home
        </Link>
      </header>
      <form onSubmit={handleSubmit}>
        <h1>Cadastro do <br/>ponto de coleta</h1>
        <Dropzone onFileUploaded={setSelectedFile} />
        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>
          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input 
              type="text"
              name="name"
              id="name"
              onChange={hanldeInputChange}
            />
          </div>
          <div className="field-group">
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input 
              type="email"
              name="email"
              id="email"
              onChange={hanldeInputChange}
            />
          </div>
          <div className="field">
            <label htmlFor="whatsapp">Whatsapp</label>
            <input 
              type="text"
              name="whatsapp"
              id="whatsapp"
              onChange={hanldeInputChange}
            />
          </div>
          </div>
        </fieldset>
        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>

          <Map 
            center={initialPosition}
           onClick={handleMapClick}
           zoom={15}
          >
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={selectedPosition}/>
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>
              <select onChange={handleSelectUf} value={selectedUf} name="uf" id="uf">
                <option value="0">Selecione uma UF</option>
                {ufs.map(uf => <option key={uf}>{uf}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="city">Cidade </label>
              <select onChange={handleSelectCity} value={selectedCity} name="city" id="city">
                <option value="0">Selecione uma Cidade</option>
                {cities.map(city => <option key={city}>{city}</option>)}
              </select>
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend>
            <h2>Ítens de coleta</h2>
            <span>Selecione um ou mais itens abaixo</span>
          </legend>
          <ul className="items-grid">
            {items.map(item => (
              <li 
                className={selectedItems.includes(item.id) ? 'selected': ''}
                key={item.id} 
                onClick={() => handleSelectItem(item.id)}>
                <img src={item.image_url} alt={item.title}/>
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        </fieldset>
        <button type="submit">Cadastrar ponto de coleta</button>
      </form>
    </div>
  )
}

export default CreatePoint