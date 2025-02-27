import { Router } from 'express';
import { BookModel } from './model';
import { ApiatoNoSQL } from '../../libs/apiato/no-sql/apiato';
import { validateFirebaseToken, roleGuard } from '../../middleware/auth.middleware';
import { UserRole } from '../../types/user';
import { BookController } from './controller';

const router = Router();
const apiato = new ApiatoNoSQL();

// Apply authentication middleware to all routes
router.use(validateFirebaseToken);

// Empty validation and population objects
const bookValidation = {};
const populationObject = {};

// Create datatable method,
router.post('/datatable', roleGuard([UserRole.ADMIN]), apiato.datatable_aggregate(BookModel, [], '', { allowDiskUse: true, search_by_field: true }));

// Get all with pagination,
router.get('/', apiato.getMany(BookModel, populationObject));

// Get one by ID,
router.get('/:id', apiato.getOneById(BookModel, populationObject));

// Create new,
router.post('/', roleGuard([UserRole.ADMIN]), apiato.createOne(BookModel, bookValidation, populationObject, { customValidationCode: 400 }));

// Update by ID,
router.put('/:id', roleGuard([UserRole.ADMIN]), apiato.updateById(BookModel, bookValidation, populationObject, { updateFieldName: 'updatedAt' }));

// Delete by ID,
router.delete('/:id', roleGuard([UserRole.ADMIN]), apiato.findIdAndDelete(BookModel));

// Additional Apiato operations,
router.post('/find-update-create', roleGuard([UserRole.ADMIN]), apiato.findUpdateOrCreate(BookModel, bookValidation, populationObject, { updateFieldName: 'updatedAt' }));

router.put('/find-update', roleGuard([UserRole.ADMIN]), apiato.findUpdate(BookModel, bookValidation, populationObject, { updateFieldName: 'updatedAt' }));

router.get('/where/first', roleGuard([UserRole.ADMIN]), apiato.getOneWhere(BookModel, populationObject));

export default router;