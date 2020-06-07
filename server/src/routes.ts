import { Router } from 'express'
import multer from 'multer'
import multerConfig from './config/multer'

import { celebrate, Joi, Segments} from 'celebrate'
import PointsController from './controllers/PointsController'
import ItemsController from './controllers/ItemsController'

const routes = Router()
const upload = multer(multerConfig)
const pointsController = new PointsController()
const itemsController = new ItemsController()

routes.get('/items', itemsController.index)

routes.post('/points', 
  upload.single('image'),
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      name: Joi.string().required(),
      email: Joi.string().required().email() ,
      whtasapp: Joi.number().required(),
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
      city: Joi.string().required(),
      uf: Joi.string().required().max(2),
      items: Joi.string().required(),
    })
  }, {
    abortEarly: false
  }),
  pointsController.create
)
routes.get('/points', pointsController.index)
routes.get('/points/:id', pointsController.show)

export default routes;