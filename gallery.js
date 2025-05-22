const ACCESS_TOKEN = 'sl.u.AFtFK2Mlx2NsqK9k3aCEy6KgCrsyoYTRyYZVSXJtVcYt0DOxHwm0l0GxteiqiqALOVdR5w53MUlCtkHzziNtrHrLdxLY_eB74rHo-dGW3xUmJyljJ_C_ENxSbHMIdXJeqAor5UQhVgOSgCndgFxlLTRYn5REHfvlwJe_1TSTTp8WqzzZOjarePLFBIHhCa1_RP2mzWKSuvBc4qOB202YOqn3jdvWtf-FM076KtFdMMieDv8gc-HvzPCBh-22STIM8GpoWnXrUEsFaclU4E25G5tncmePhh0vjOFKxXtyqrQFhO68WTbYXBzblmKH1kn_kb-nmM2NP_c7yrgofGDQndBPXjoYK8YXxj7FjCWlNsvGKsHaRhjxhHwZ7AFe8CkdOl6fjLGEztgKMIvmcy9q4IrulbkzN2w5RKiHqrseRiKUcE0Axf27FvnCQSoxCHgt3jvCu_ug1qsLafjIkVxgVSvNTo4LH-fAMpnC831ahzWdWlJxL-0CAYglM4EoMpA5g8KxJwPQytdZM24zZqcZXKM2krol0lSEIt35Fcgl8wI_Ay1HPgtxPzEbmjmwb2Kc9Ui1Idp9ppojJ2mJHHnBSU1SP4jxtfQYLrBRimISXoA4EoKq1wcsLqvW-2LADDgdE61cbUOnzxRGjr4FBOd_j5Hpn3t3AklCGJVOu8dyc0DhrhqAzetWGaRmI_wNFUf9ReMUIkgcnzXFGYJkzniZMJvfChYULeBwr29Lq8wGBjBNVRhiy3swc7xdvhL0Nz385-TuWW6RD4O26WZ_8R5TMXODFQj89G7EJdqhxVIDScOngk5JR9IL8SArA64GRSPA1fDqQARQCzpQHrIOAzjmlngWrzd8-Bbyd4vahtuCGIIsiotNmn6eAUvNS7YhKPVBX0XlwkgboYLO9HowBVgxf63B300aWNnHmiWyeSXuXb0puvyF7oNuJf5rfglCtrXgkmB8zm-SS-51vCuuVAybTukhDLcK-wo-de-XLrF8zM4qKAAD_g0jLMZshk3Kim0H51Dn81v5lY1bf4LSw_mV7CxIReaNgY6cn-m1-523Ai_tNMhToLsBTiyHuGwZIwYkPPPtL6-HGNOcax8RFiw7yVI0uO73TAF6dACQJo_Abz_iJsNNJfZoZF-3ZIW9MaT4aBuIS6Wn-7Yyey7_ao7iZxvY0TRfakztzD3OkuM130PmTnLvsf4MHGIBxsee6-h0GXRBkzIYFsYgM5WBadpQi2JCno_7EYgInyngHTuQORO4mVozx-seFjmzMedwwQ2_gATKt9siEa3GY-EMpp2hN20RKpGWL8rXXGnWmidYjo6M6s9pqXni0AV3WQGBD1OEOLeJ1AjpeWYK3S7IYmYI8dAv';
const ROOT_PATH = '/CuratedImages';
let currentPath = ROOT_PATH;
let breadcrumbs = [];
let latestRenderId = 0;
let rootFolderData = [];

const searchInput = document.getElementById('search');
searchInput.addEventListener('input', () => {
  if (currentPath === ROOT_PATH) {
    renderRootFromCache(searchInput.value.toLowerCase());
  } else {
    renderGallery(currentPath, searchInput.value.toLowerCase());
  }
});

async function listFolder(path) {
  const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ path })
  });
  const data = await response.json();
  return data.entries;
}

async function getFullImage(path) {
  const response = await fetch('https://api.dropboxapi.com/2/files/get_temporary_link', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ path })
  });

  const data = await response.json();
  return data.link;
}



async function renderGallery(path, filter = '') {
  let currentImages = []; // array of { file, src }
  let currentIndex = 0;

  function openFullscreen(clickedSrc) {
    currentIndex = currentImages.findIndex(img => img.src === clickedSrc);
    if (currentIndex === -1) return;

    const viewer = document.createElement('div');
    viewer.className = 'fullscreen-viewer';
    viewer.innerHTML = `
      <div class="fullscreen-overlay"></div>
            <button class="fullscreen-prev">←</button>
      <img class="fullscreen-image" />
      <button class="fullscreen-next">→</button>
    `;

    document.body.appendChild(viewer);
    document.body.style.overflow = 'hidden';

    const imageEl = viewer.querySelector('.fullscreen-image');
        const prevBtn = viewer.querySelector('.fullscreen-prev');
    const nextBtn = viewer.querySelector('.fullscreen-next');

    function updateImage() {
      imageEl.style.opacity = '0';
      setTimeout(() => {
        imageEl.src = currentImages[currentIndex].src;
        imageEl.onload = () => imageEl.style.opacity = '1';
      }, 100);
    }

    viewer.addEventListener('click', e => {
      if (e.target.classList.contains('fullscreen-overlay')) {
        viewer.remove();
        document.body.style.overflow = '';
        document.removeEventListener('keydown', keyHandler);
      }
    });

    prevBtn.onclick = () => {
      currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
      updateImage();
    };

    nextBtn.onclick = () => {
      currentIndex = (currentIndex + 1) % currentImages.length;
      updateImage();
    };

    function keyHandler(e) {
      if (e.key === 'ArrowLeft') prevBtn.click();
      else if (e.key === 'ArrowRight') nextBtn.click();
      else if (e.key === 'Escape') {
        viewer.remove();
        document.body.style.overflow = '';
        document.removeEventListener('keydown', keyHandler);
      }
    }

    document.addEventListener('keydown', keyHandler);

    updateImage();
  }
  document.body.classList.add('loading');
  const renderId = ++latestRenderId;
  currentPath = path;

  const gallery = document.getElementById('gallery');
  gallery.style.opacity = '0.01';
  gallery.innerHTML = '';
  requestAnimationFrame(() => {
    gallery.style.opacity = '1';
  });

  const header = document.getElementById('search-container');
  header.innerHTML = '';
  if (path !== ROOT_PATH) {
    const back = document.createElement('button');
    back.className = 'back-button';
    back.textContent = '← Back';
    back.onclick = () => {
      breadcrumbs.pop();
      searchInput.value = '';
      currentPath = ROOT_PATH;
      header.innerHTML = '';
      header.appendChild(searchInput);
      renderRootFromCache();
    };
    header.appendChild(back);
  } else {
    header.appendChild(searchInput);
  }

  const entries = await listFolder(path);
  if (renderId !== latestRenderId) return;

  const files = entries.filter(e => e['.tag'] === 'file' && e.name.match(/\.(jpg|jpeg|png)$/i));

  for (const [index, file] of files.entries()) {
    if (!file.name.toLowerCase().includes(filter)) continue;

    const card = document.createElement('div');
    card.className = 'card';

    getFullImage(file.path_lower).then(src => {
      currentImages.push({ file, src });
      const holder = document.createElement('img');
      holder.className = 'img-holder';
      holder.style.filter = 'blur(20px)';
      holder.style.width = '100%';
      holder.style.height = '100%';
      holder.style.objectFit = 'cover';
      holder.src = src;
      card.appendChild(holder);

      const img = document.createElement('img');
      img.src = src;
      img.alt = file.name;
      img.onload = () => {
        card.replaceChild(img, holder);
      };
      img.className = 'loaded-image';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';

      card.onclick = () => openFullscreen(src);
    });

    gallery.appendChild(card);
  }
  document.body.classList.remove('loading');
  }


async function renderRootFromCache(filter = '') {
  document.body.classList.add('loading');
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';

  for (const folder of rootFolderData) {
    if (!folder.name.toLowerCase().includes(filter)) continue;

    const card = document.createElement('div');
    card.className = 'card';

    card.onclick = () => {
      breadcrumbs.push(folder.path);
      renderGallery(folder.path);
    };

    gallery.appendChild(card);

    getFullImage(folder.thumbPath).then(src => {
      const holder = document.createElement('img');
      holder.className = 'img-holder';
      holder.style.filter = 'blur(20px)';
      holder.style.width = '100%';
      holder.style.height = '100%';
      holder.style.objectFit = 'cover';
      holder.src = src;
      card.appendChild(holder);

      const img = document.createElement('img');
      img.src = src;
      img.alt = folder.name;
      img.onload = () => {
        card.replaceChild(img, holder);
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.textContent = folder.name;
        card.appendChild(overlay);
      document.body.classList.remove('loading');
      };
      img.className = 'loaded-image';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
    });
  }
}

async function initRoot() {
  const entries = await listFolder(ROOT_PATH);
  const folders = entries.filter(e => e['.tag'] === 'folder');
  rootFolderData = folders.map(folder => ({
    name: folder.name,
    path: folder.path_lower,
    thumbPath: null
  }));

  for (const folder of rootFolderData) {
    const contents = await listFolder(folder.path);
    const preview = contents.find(f => f['.tag'] === 'file' && f.name.match(/\.(jpg|jpeg|png)$/i));
    if (preview) {
      folder.thumbPath = preview.path_lower;
    }
  }

  renderRootFromCache();
}
initRoot();
