function HomePage() {
  const imageStyle = {
    width: '100%',
    height: '250px',
    objectFit: 'cover'
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Search clicked');
  };

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light" style={{ backgroundColor: '#fafafa' }}>
        <div className="container-fluid">
          <a className="navbar-brand" href="/">
            <img src="https://getbootstrap.com/docs/4.0/assets/brand/bootstrap-solid.svg" width="30" height="30" className="d-inline-block align-top me-2" alt="" />
            Project Name
          </a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a className="nav-link active" aria-current="page" href="/">1</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">2</a>
              </li>
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  3
                </a>
                <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                  <li><a className="dropdown-item" href="#">Action</a></li>
                  <li><a className="dropdown-item" href="#">Another action</a></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><a className="dropdown-item" href="#">Something else here</a></li>
                </ul>
              </li>
            </ul>
            <div className="d-flex">
              <button onClick={() => window.location.href = '#'} className="btn btn-outline-primary me-3">Login</button>
              <input className="form-control me-2" type="search" placeholder="Search" aria-label="Search" />
              <button className="btn btn-outline-success" onClick={handleSearch}>Search</button>
            </div>
          </div>
        </div>
      </nav>

      <hr />

      <div className='container-fluid' style={{ maxWidth: '1800px', margin: '0 auto' }}>
        <div className='row g-4'>
          <div className='col-12 col-md-6 col-lg-3'>
            <div className="card h-100">
              <img src="https://bigzoo.com.ua/image/cache/catalog/Animals/Popugai/malenkiye/volnistyye/volnistyy_goluboy1-750x750-product_thumb.jpg" className="card-img-top" alt="C++ Course" style={imageStyle} />
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">Course C++</h5>
                <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                <a href="#" className="btn btn-primary mt-auto">Go to course</a>
              </div>
            </div>
          </div>

          <div className='col-12 col-md-6 col-lg-3'>
            <div className="card h-100">
              <img src="https://www.rodyna.in.ua/wp-content/uploads/2018/09/%D0%92%D1%96%D0%B4%D0%B2%D0%B0%D0%B6%D0%BD%D0%B0-%D0%BA%D0%B2%D1%96%D1%82%D0%BA%D0%B0_6_1.jpg" className="card-img-top" alt="JavaScript Course" style={imageStyle} />
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">Course JS</h5>
                <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                <a href="#" className="btn btn-primary mt-auto">Go to course</a>
              </div>
            </div>
          </div>

          <div className='col-12 col-md-6 col-lg-3'>
            <div className="card h-100">
              <img src="https://justzoo.com.ua/image/cache/catalog/image/cache/catalog/blog/a661e463c551a01ef4b1d01b4b22dfb6-890x0.webp" className="card-img-top" alt="Python Course" style={imageStyle} />
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">Course Python</h5>
                <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                <a href="#" className="btn btn-primary mt-auto">Go to course</a>
              </div>
            </div>
          </div>

          <div className='col-12 col-md-6 col-lg-3'>
            <div className="card h-100">
              <img src="https://bigzoo.com.ua/image/cache/catalog/Animals/Popugai/sredniye/Ozherelovyye/ozherelovyy_zelenyy_na_dokorm2-750x750-product_thumb.jpg" className="card-img-top" alt="Java Course" style={imageStyle} />
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">Course Java</h5>
                <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                <a href="#" className="btn btn-primary mt-auto">Go to course</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;