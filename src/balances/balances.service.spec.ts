import { BalancesService } from './balances.service';

describe('BalancesService', () => {
  let service: BalancesService;
  const mockComputeAllBalances = (balances: { userId: string; balance: number }[]) => {
    jest
      .spyOn(service as unknown as { computeAllBalances: () => Promise<unknown> }, 'computeAllBalances')
      .mockResolvedValue(balances);
  };

  beforeEach(() => {
    service = new BalancesService({} as never, {} as never);
  });

  describe('getSettle', () => {
    it('caps transfers by what each creditor is owed', async () => {
      mockComputeAllBalances([
        { userId: 'debtor', balance: -200 },
        { userId: 'creditor-a', balance: 50 },
        { userId: 'creditor-b', balance: 150 },
      ]);

      const result = await service.getSettle('user-1', 'group-1');

      expect(result).toEqual({
        groupId: 'group-1',
        transfers: [
          { fromUserId: 'debtor', toUserId: 'creditor-a', amount: 50 },
          { fromUserId: 'debtor', toUserId: 'creditor-b', amount: 150 },
        ],
        page: 1,
        pageSize: 20,
        total: 2,
      });
    });

    it('returns no transfers when all balances are zero', async () => {
      mockComputeAllBalances([
        { userId: 'user-a', balance: 0 },
        { userId: 'user-b', balance: 0 },
      ]);

      const result = await service.getSettle('user-1', 'group-1');

      expect(result).toEqual({
        groupId: 'group-1',
        transfers: [],
        page: 1,
        pageSize: 20,
        total: 0,
      });
    });

    it('settles across multiple debtors and creditors', async () => {
      mockComputeAllBalances([
        { userId: 'debtor-a', balance: -300 },
        { userId: 'debtor-b', balance: -100 },
        { userId: 'creditor-a', balance: 250 },
        { userId: 'creditor-b', balance: 150 },
      ]);

      const result = await service.getSettle('user-1', 'group-2');

      expect(result).toEqual({
        groupId: 'group-2',
        transfers: [
          { fromUserId: 'debtor-a', toUserId: 'creditor-a', amount: 250 },
          { fromUserId: 'debtor-a', toUserId: 'creditor-b', amount: 50 },
          { fromUserId: 'debtor-b', toUserId: 'creditor-b', amount: 100 },
        ],
        page: 1,
        pageSize: 20,
        total: 3,
      });
    });
  });
});
