# Blockrok

## Development

### Database

```bash
# Start the database on docker
npm run db:start

# Generate the Prisma client
npx prisma generate

# Push the Prisma schema to the database
npx prisma db push

# Reset everything
npm run db:reset

# Run the Prisma Studio
npx prisma studio
```
