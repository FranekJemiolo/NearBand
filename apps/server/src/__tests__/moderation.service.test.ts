import { SquelchModerationService } from '../services/moderation.service';

describe('SquelchModerationService', () => {
  let moderation: SquelchModerationService;

  beforeEach(() => {
    moderation = new SquelchModerationService({ threshold: 3 });
  });

  it('increments vote count on unique reporter votes', async () => {
    const res1 = await moderation.voteSquelch('grid_1', 'bad_user', 'reporter_1');
    expect(res1.voteCount).toBe(1);
    expect(res1.isSquelched).toBe(false);

    const res2 = await moderation.voteSquelch('grid_1', 'bad_user', 'reporter_2');
    expect(res2.voteCount).toBe(2);
    expect(res2.isSquelched).toBe(false);
  });

  it('prevents double-voting from the same reporter', async () => {
    await moderation.voteSquelch('grid_1', 'bad_user', 'reporter_1');
    const res = await moderation.voteSquelch('grid_1', 'bad_user', 'reporter_1');
    expect(res.voteCount).toBe(1);
    expect(res.isSquelched).toBe(false);
  });

  it('squelches user when threshold is reached', async () => {
    await moderation.voteSquelch('grid_1', 'bad_user', 'reporter_1');
    await moderation.voteSquelch('grid_1', 'bad_user', 'reporter_2');
    const res3 = await moderation.voteSquelch('grid_1', 'bad_user', 'reporter_3');

    expect(res3.voteCount).toBe(3);
    expect(res3.isSquelched).toBe(true);

    const isSquelched = await moderation.isUserSquelched('grid_1', 'bad_user');
    expect(isSquelched).toBe(true);
  });
});
