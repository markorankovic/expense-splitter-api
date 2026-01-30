import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

const expensesServiceMock = {
  createExpense: jest.fn(),
  listExpenses: jest.fn(),
  getExpense: jest.fn(),
};

describe('ExpensesController', () => {
  let controller: ExpensesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpensesController],
      providers: [{ provide: ExpensesService, useValue: expensesServiceMock }],
    }).compile();

    controller = module.get<ExpensesController>(ExpensesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
