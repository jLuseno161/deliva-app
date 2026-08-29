# Deliva

Delivery coordination for small Kenyan retailers. See [DESIGN.md](./DESIGN.md) for architecture, ERD, and trade-off log.

## Run locally

```bash
cd server
npm install
npm run seed    # creates 4 demo users (password for all: demo123)
npm start        # http://localhost:3000
```

Demo accounts:
| Role | Phone | Password |
|---|---|---|
| Retailer | 0700000001 | demo123 |
| Dispatcher | 0700000002 | demo123 |
| Rider | 0700000003 | demo123 |
| Rider (2nd) | 0700000004 | demo123 |

## Demo script
1. Sign in as **Retailer** (0700000001) → log a delivery request.
2. Sign in as **Dispatcher** (0700000002) in another tab → see it appear live → assign to a rider.
3. Sign in as **Rider** (0700000003) in a third tab → see the assignment appear live → Mark Picked Up → enter any code → Mark Delivered.
4. Point out the retailer tab updating in real time with no refresh.