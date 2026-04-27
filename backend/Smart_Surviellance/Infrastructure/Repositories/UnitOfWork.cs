using Application.Interfaces;
using Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Text;

namespace Infrastructure.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {

        private readonly ApplicationDbContext _context;
       
        private bool _disposed;

        private ICameraRepository? _cameraRepository;
        private IAlertRepository? _alertRepository;

        public UnitOfWork(ApplicationDbContext context)
        {
            _context = context;
        }




        public ICameraRepository CameraRepository => _cameraRepository ??= new CameraRepository(_context);

        public IAlertRepository AlertRepository => _alertRepository ??= new AlertRepository(_context);
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing)
        {
            if (!_disposed)
            {
                if (disposing)
                {
                    _context.Dispose();
                }

                _disposed = true;
            }
        }

        public Task<int> SaveChangesAsync()
        {
            return _context.SaveChangesAsync();
        }
    }
}
